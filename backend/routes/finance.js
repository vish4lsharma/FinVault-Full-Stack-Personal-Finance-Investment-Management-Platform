const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Get paginated transaction history
router.get('/transactions', authenticateToken, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const result = await db.query(
            `SELECT t.id, t.type, t.amount, t.description, t.date, c.name as category 
       FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 
       ORDER BY t.date DESC
       LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        const countResult = await db.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [req.user.id]);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSV Export
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
        res.attachment('transactions.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Category-wise spending (for Pie Chart)
router.get('/analytics/spending', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.name, SUM(t.amount) as total 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = $1 AND t.type = 'expense' 
       GROUP BY c.name`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Monthly Income vs Expense (for Bar Chart)
router.get('/analytics/trends', authenticateToken, async (req, res) => {
    try {
        // Requires composite index on user_id, date which is implemented in init.sql
        const result = await db.query(
            `SELECT TO_CHAR(date, 'YYYY-MM') as month, type, SUM(amount) as total 
       FROM transactions 
       WHERE user_id = $1 
       GROUP BY TO_CHAR(date, 'YYYY-MM'), type 
       ORDER BY month`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
