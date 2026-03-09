const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Analytics: Summary Card (total income, expense, net, savings rate) ───────
router.get('/analytics/summary', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
                COUNT(*) AS transaction_count
             FROM transactions
             WHERE user_id = $1`,
            [req.user.id]
        );
        const { total_income, total_expense, transaction_count } = result.rows[0];
        const net = Number(total_income) - Number(total_expense);
        const savings_rate = total_income > 0 ? ((net / total_income) * 100).toFixed(1) : 0;
        res.json({ total_income: Number(total_income), total_expense: Number(total_expense), net, savings_rate: Number(savings_rate), transaction_count: Number(transaction_count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Analytics: Spending by Category ─────────────────────────────────────────
router.get('/analytics/spending', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.name, SUM(t.amount) as total
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1 AND t.type = 'expense'
             GROUP BY c.name
             ORDER BY total DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Analytics: Monthly Trends ────────────────────────────────────────────────
router.get('/analytics/trends', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT TO_CHAR(date, 'YYYY-MM') as month, type, SUM(amount) as total
             FROM transactions
             WHERE user_id = $1
             GROUP BY TO_CHAR(date, 'YYYY-MM'), type
             ORDER BY month ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Budgets: Get all user budgets ────────────────────────────────────────────
router.get('/budgets', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT b.id, b.monthly_limit, c.name as category,
                    COALESCE(
                        (SELECT SUM(t.amount) FROM transactions t
                         WHERE t.user_id = $1 AND t.category_id = b.category_id
                           AND t.type = 'expense'
                           AND TO_CHAR(t.date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                        ), 0
                    ) AS spent
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = $1
             ORDER BY c.name`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Budgets: Upsert budget for a category ────────────────────────────────────
router.post('/budgets', authenticateToken, [
    body('category_id').isInt(),
    body('monthly_limit').isFloat({ gt: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category_id, monthly_limit } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO budgets (user_id, category_id, monthly_limit)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, category_id) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
             RETURNING *`,
            [req.user.id, category_id, monthly_limit]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Transactions: Add new ────────────────────────────────────────────────────
router.post('/transactions', authenticateToken, [
    body('amount').isFloat({ gt: 0 }),
    body('type').isIn(['income', 'expense']),
    body('description').notEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { amount, type, description, category } = req.body;
    try {
        let categoryId = null;
        if (category) {
            const catRes = await db.query(
                'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                [category]
            );
            categoryId = catRes.rows[0]?.id || null;
        }
        const result = await db.query(
            'INSERT INTO transactions (user_id, type, amount, description, category_id, date) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING *',
            [req.user.id, type, amount, description, categoryId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Transactions: Get paginated, with filters ────────────────────────────────
router.get('/transactions', authenticateToken, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['income', 'expense']),
    query('category').optional().isString(),
    query('search').optional().isString()
], async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { type, category, search } = req.query;

    let where = 'WHERE t.user_id = $1';
    const params = [req.user.id];
    let pi = 2;

    if (type) { where += ` AND t.type = $${pi++}`; params.push(type); }
    if (category) { where += ` AND c.name ILIKE $${pi++}`; params.push(`%${category}%`); }
    if (search) { where += ` AND t.description ILIKE $${pi++}`; params.push(`%${search}%`); }

    try {
        const result = await db.query(
            `SELECT t.id, t.type, t.amount, t.description, t.date, c.name as category
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             ${where}
             ORDER BY t.date DESC, t.created_at DESC
             LIMIT $${pi++} OFFSET $${pi++}`,
            [...params, limit, offset]
        );
        const countRes = await db.query(`SELECT COUNT(*) FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ${where}`, params);
        const total = parseInt(countRes.rows[0].count);

        res.json({
            data: result.rows,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Transactions: CSV Export ─────────────────────────────────────────────────
router.get('/transactions/export', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.id, t.type, t.amount, t.description, t.date, c.name as category
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1
             ORDER BY t.date DESC`,
            [req.user.id]
        );
        let csv = 'ID,Type,Amount,Description,Date,Category\n';
        result.rows.forEach(row => {
            csv += `${row.id},${row.type},${row.amount},"${(row.description || '').replace(/"/g, '""')}",${row.date.toISOString().split('T')[0]},${row.category || ''}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('finvault-transactions.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Stocks: Real-Time Tracker ─────────────────────────────────────────────
router.get('/stocks', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM stock_prices ORDER BY ticker ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
