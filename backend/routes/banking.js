const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── Get account info ────────────────────────────────────────────────────────
router.get('/account', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, balance, created_at FROM accounts WHERE user_id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'No account found. Create one first.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Get balance ──────────────────────────────────────────────────────────────
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT balance FROM accounts WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Get transfer history ─────────────────────────────────────────────────────
router.get('/transfers', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT bt.id, bt.amount, bt.status, bt.created_at,
                    u_from.email as from_email, u_to.email as to_email,
                    CASE WHEN a_from.user_id = $1 THEN 'sent' ELSE 'received' END as direction
             FROM bank_transfers bt
             JOIN accounts a_from ON bt.from_account = a_from.id
             JOIN accounts a_to   ON bt.to_account   = a_to.id
             JOIN users u_from ON a_from.user_id = u_from.id
             JOIN users u_to   ON a_to.user_id   = u_to.id
             WHERE a_from.user_id = $1 OR a_to.user_id = $1
             ORDER BY bt.created_at DESC
             LIMIT 20`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Create account ───────────────────────────────────────────────────────────
router.post('/account', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'INSERT INTO accounts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            const existing = await db.query('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
            return res.status(200).json(existing.rows[0]);
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Deposit
router.post('/deposit', authenticateToken, [body('amount').isFloat({ gt: 0 })], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { amount } = req.body;
    try {
        const result = await db.query(
            'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2 RETURNING *',
            [amount, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        // Add transaction record
        await db.query(
            "INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1, 'income', $2, 'Deposit', CURRENT_DATE)",
            [req.user.id, amount]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Withdraw
router.post('/withdraw', authenticateToken, [body('amount').isFloat({ gt: 0 })], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { amount } = req.body;
    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');
        const accRes = await client.query('SELECT balance FROM accounts WHERE user_id = $1 FOR UPDATE', [req.user.id]);
        if (accRes.rows.length === 0) throw new Error('Account not found');
        if (accRes.rows[0].balance < amount) throw new Error('Insufficient funds');

        const result = await client.query(
            'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2 RETURNING *',
            [amount, req.user.id]
        );

        await client.query(
            "INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1, 'expense', $2, 'Withdrawal', CURRENT_DATE)",
            [req.user.id, amount]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Fund Transfer (ACID compliant)
router.post('/transfer', authenticateToken, [
    body('amount').isFloat({ gt: 0 }),
    body('to_user_email').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { amount, to_user_email } = req.body;

    if (req.user.email === to_user_email) {
        return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');

        const senderRes = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [req.user.id]);
        if (senderRes.rows.length === 0) throw new Error('Sender account not found');
        if (senderRes.rows[0].balance < amount) throw new Error('Insufficient funds');
        const from_account = senderRes.rows[0].id;

        const receiverUser = await client.query('SELECT id FROM users WHERE email = $1', [to_user_email]);
        if (receiverUser.rows.length === 0) throw new Error('Receiver user not found');
        const to_user_id = receiverUser.rows[0].id;

        const receiverRes = await client.query('SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE', [to_user_id]);
        if (receiverRes.rows.length === 0) throw new Error('Receiver account not found');
        const to_account = receiverRes.rows[0].id;

        await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, from_account]);
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, to_account]);

        await client.query(
            'INSERT INTO bank_transfers (from_account, to_account, amount) VALUES ($1, $2, $3)',
            [from_account, to_account, amount]
        );

        await client.query(
            "INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1, 'expense', $2, $3, CURRENT_DATE)",
            [req.user.id, amount, `Transfer to ${to_user_email}`]
        );
        await client.query(
            "INSERT INTO transactions (user_id, type, amount, description, date) VALUES ($1, 'income', $2, $3, CURRENT_DATE)",
            [to_user_id, amount, `Transfer from User ID ${req.user.id}`]
        );

        await client.query('COMMIT');
        res.json({ message: 'Transfer successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
