// FinVault Demo Data Seed Script
// Run inside Docker: docker exec finvault-backend node seed.js

const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding FinVault demo data...');

    // ─── 1. Create / ensure admin user ──────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);
    const userRes = await db.query(
        `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, email`,
        ['admin@finvault.com', hash, 'Vishal Sharma', 'admin']
    );
    const userId = userRes.rows[0].id;
    console.log(`✓ User ready: ${userRes.rows[0].email} (${userId})`);

    // ─── 2. Create / top-up banking account ─────────────────────────────────────
    await db.query(
        `INSERT INTO accounts (user_id, balance)
     VALUES ($1, 18450.75)
     ON CONFLICT (user_id) DO UPDATE SET balance = 18450.75`,
        [userId]
    );
    console.log('✓ Banking account ready: $18,450.75');

    // ─── 3. Get category ids ─────────────────────────────────────────────────────
    const catRes = await db.query('SELECT id, name FROM categories');
    const cats = {};
    catRes.rows.forEach(r => { cats[r.name.toLowerCase()] = r.id; });

    // Ensure Shopping and Investment exist
    for (const name of ['Shopping', 'Investment', 'Salary', 'Food', 'Rent', 'Travel', 'Utilities', 'Entertainment', 'Health']) {
        const r = await db.query(
            "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name",
            [name]
        );
        cats[r.rows[0].name.toLowerCase()] = r.rows[0].id;
    }
    console.log('✓ Categories ready');

    // ─── 4. Clear existing demo transactions ────────────────────────────────────
    await db.query("DELETE FROM transactions WHERE user_id = $1", [userId]);

    // ─── 5. Insert 6 months of realistic transactions ────────────────────────────
    const txns = [
        // ── September 2025 ───────────────────────────────────────────────────────
        { date: '2025-09-01', type: 'income', amount: 5200.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2025-09-03', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2025-09-05', type: 'expense', amount: 320.50, desc: 'Weekly Groceries', cat: 'food' },
        { date: '2025-09-08', type: 'expense', amount: 89.99, desc: 'Netflix & Spotify', cat: 'entertainment' },
        { date: '2025-09-10', type: 'expense', amount: 210.00, desc: 'Electricity & Internet', cat: 'utilities' },
        { date: '2025-09-12', type: 'income', amount: 450.00, desc: 'Freelance Project', cat: 'salary' },
        { date: '2025-09-15', type: 'expense', amount: 185.00, desc: 'Gym & Health Insurance', cat: 'health' },
        { date: '2025-09-18', type: 'expense', amount: 275.00, desc: 'Weekend Mumbai Trip', cat: 'travel' },
        { date: '2025-09-20', type: 'expense', amount: 145.80, desc: 'Amazon Shopping', cat: 'shopping' },
        { date: '2025-09-22', type: 'expense', amount: 95.00, desc: 'Restaurant Dinner', cat: 'food' },
        { date: '2025-09-25', type: 'income', amount: 320.00, desc: 'Stock Dividends AAPL', cat: 'investment' },
        { date: '2025-09-28', type: 'expense', amount: 55.00, desc: 'Coffee & Snacks', cat: 'food' },

        // ── October 2025 ─────────────────────────────────────────────────────────
        { date: '2025-10-01', type: 'income', amount: 5200.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2025-10-02', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2025-10-04', type: 'expense', amount: 290.75, desc: 'Grocery Store', cat: 'food' },
        { date: '2025-10-06', type: 'expense', amount: 350.00, desc: 'Diwali Shopping', cat: 'shopping' },
        { date: '2025-10-10', type: 'expense', amount: 210.00, desc: 'Monthly Bills', cat: 'utilities' },
        { date: '2025-10-12', type: 'income', amount: 800.00, desc: 'Consulting Fee', cat: 'salary' },
        { date: '2025-10-15', type: 'expense', amount: 185.00, desc: 'Health Insurance', cat: 'health' },
        { date: '2025-10-17', type: 'expense', amount: 480.00, desc: 'Goa Trip Flights', cat: 'travel' },
        { date: '2025-10-20', type: 'expense', amount: 89.99, desc: 'Streaming Services', cat: 'entertainment' },
        { date: '2025-10-22', type: 'income', amount: 500.00, desc: 'Investment Returns', cat: 'investment' },
        { date: '2025-10-25', type: 'expense', amount: 125.00, desc: 'Dining Out', cat: 'food' },
        { date: '2025-10-28', type: 'expense', amount: 200.00, desc: 'New Clothes', cat: 'shopping' },

        // ── November 2025 ────────────────────────────────────────────────────────
        { date: '2025-11-01', type: 'income', amount: 5200.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2025-11-02', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2025-11-05', type: 'expense', amount: 310.20, desc: 'Grocery & Vegetables', cat: 'food' },
        { date: '2025-11-07', type: 'expense', amount: 210.00, desc: 'Utilities', cat: 'utilities' },
        { date: '2025-11-10', type: 'expense', amount: 89.99, desc: 'Subscriptions', cat: 'entertainment' },
        { date: '2025-11-12', type: 'income', amount: 1200.00, desc: 'Bonus Payout', cat: 'salary' },
        { date: '2025-11-15', type: 'expense', amount: 185.00, desc: 'Medical Checkup', cat: 'health' },
        { date: '2025-11-18', type: 'expense', amount: 155.00, desc: 'Bangalore Day Trip', cat: 'travel' },
        { date: '2025-11-20', type: 'expense', amount: 420.00, desc: 'Electronics Purchase', cat: 'shopping' },
        { date: '2025-11-22', type: 'income', amount: 280.00, desc: 'Dividend Payment', cat: 'investment' },
        { date: '2025-11-25', type: 'expense', amount: 78.50, desc: 'Coffee Shop', cat: 'food' },
        { date: '2025-11-28', type: 'expense', amount: 130.00, desc: 'Movie Night', cat: 'entertainment' },

        // ── December 2025 ────────────────────────────────────────────────────────
        { date: '2025-12-01', type: 'income', amount: 5200.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2025-12-01', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2025-12-03', type: 'income', amount: 2000.00, desc: 'Year-End Bonus', cat: 'salary' },
        { date: '2025-12-05', type: 'expense', amount: 350.00, desc: 'Christmas Groceries', cat: 'food' },
        { date: '2025-12-08', type: 'expense', amount: 210.00, desc: 'Utilities', cat: 'utilities' },
        { date: '2025-12-10', type: 'expense', amount: 650.00, desc: 'Holiday Gifts', cat: 'shopping' },
        { date: '2025-12-15', type: 'expense', amount: 185.00, desc: 'Health Insurance', cat: 'health' },
        { date: '2025-12-18', type: 'expense', amount: 1200.00, desc: 'Maldives Trip', cat: 'travel' },
        { date: '2025-12-20', type: 'expense', amount: 89.99, desc: 'Streaming Services', cat: 'entertainment' },
        { date: '2025-12-22', type: 'income', amount: 750.00, desc: 'Stock Gains', cat: 'investment' },
        { date: '2025-12-25', type: 'expense', amount: 200.00, desc: 'Christmas Dinner', cat: 'food' },
        { date: '2025-12-28', type: 'expense', amount: 450.00, desc: 'New Year Party', cat: 'entertainment' },

        // ── January 2026 ─────────────────────────────────────────────────────────
        { date: '2026-01-01', type: 'income', amount: 5500.00, desc: 'Monthly Salary (Raise)', cat: 'salary' },
        { date: '2026-01-02', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2026-01-04', type: 'expense', amount: 295.40, desc: 'Weekly Groceries', cat: 'food' },
        { date: '2026-01-06', type: 'expense', amount: 210.00, desc: 'Monthly Bills', cat: 'utilities' },
        { date: '2026-01-08', type: 'expense', amount: 89.99, desc: 'Subscriptions', cat: 'entertainment' },
        { date: '2026-01-10', type: 'expense', amount: 185.00, desc: 'Health Insurance', cat: 'health' },
        { date: '2026-01-12', type: 'income', amount: 600.00, desc: 'Freelance Project', cat: 'salary' },
        { date: '2026-01-15', type: 'expense', amount: 320.00, desc: 'Winter Clothes', cat: 'shopping' },
        { date: '2026-01-18', type: 'expense', amount: 220.00, desc: 'Weekend Getaway', cat: 'travel' },
        { date: '2026-01-22', type: 'income', amount: 420.00, desc: 'Dividend Income', cat: 'investment' },
        { date: '2026-01-25', type: 'expense', amount: 110.00, desc: 'Restaurant', cat: 'food' },
        { date: '2026-01-28', type: 'expense', amount: 175.00, desc: 'Gaming Purchases', cat: 'entertainment' },

        // ── February 2026 ────────────────────────────────────────────────────────
        { date: '2026-02-01', type: 'income', amount: 5500.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2026-02-01', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2026-02-03', type: 'expense', amount: 280.00, desc: 'Grocery Shopping', cat: 'food' },
        { date: '2026-02-05', type: 'expense', amount: 210.00, desc: 'Electricity & Internet', cat: 'utilities' },
        { date: '2026-02-08', type: 'expense', amount: 89.99, desc: 'Netflix & Spotify', cat: 'entertainment' },
        { date: '2026-02-10', type: 'income', amount: 900.00, desc: 'Consulting Revenue', cat: 'salary' },
        { date: '2026-02-12', type: 'expense', amount: 350.00, desc: "Valentine's Dinner", cat: 'food' },
        { date: '2026-02-14', type: 'expense', amount: 185.00, desc: 'Health & Gym', cat: 'health' },
        { date: '2026-02-18', type: 'expense', amount: 290.00, desc: 'Laptop Accessories', cat: 'shopping' },
        { date: '2026-02-20', type: 'income', amount: 380.00, desc: 'MSFT Dividends', cat: 'investment' },
        { date: '2026-02-22', type: 'expense', amount: 160.00, desc: 'Pune Day Trip', cat: 'travel' },
        { date: '2026-02-25', type: 'expense', amount: 95.00, desc: 'Cafe & Brunch', cat: 'food' },
        { date: '2026-02-28', type: 'expense', amount: 240.00, desc: 'Sports Equipment', cat: 'shopping' },

        // ── March 2026 ───────────────────────────────────────────────────────────
        { date: '2026-03-01', type: 'income', amount: 5500.00, desc: 'Monthly Salary', cat: 'salary' },
        { date: '2026-03-01', type: 'expense', amount: 1500.00, desc: 'Rent Payment', cat: 'rent' },
        { date: '2026-03-03', type: 'expense', amount: 265.00, desc: 'Weekly Groceries', cat: 'food' },
        { date: '2026-03-05', type: 'expense', amount: 210.00, desc: 'Monthly Utilities', cat: 'utilities' },
        { date: '2026-03-07', type: 'expense', amount: 89.99, desc: 'Streaming Services', cat: 'entertainment' },
        { date: '2026-03-08', type: 'income', amount: 500.00, desc: 'Investment Dividend', cat: 'investment' },
        { date: '2026-03-09', type: 'expense', amount: 185.00, desc: 'Health Insurance', cat: 'health' },
    ];

    for (const tx of txns) {
        await db.query(
            'INSERT INTO transactions (user_id, type, amount, description, category_id, date) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, tx.type, tx.amount, tx.desc, cats[tx.cat] || null, tx.date]
        );
    }
    console.log(`✓ Inserted ${txns.length} demo transactions (Sep 2025 – Mar 2026)`);

    // ─── 6. Insert demo budgets ──────────────────────────────────────────────────
    const budgets = [
        { cat: 'food', limit: 600 },
        { cat: 'rent', limit: 1500 },
        { cat: 'shopping', limit: 400 },
        { cat: 'entertainment', limit: 200 },
        { cat: 'travel', limit: 300 },
        { cat: 'health', limit: 200 },
        { cat: 'utilities', limit: 250 },
    ];
    for (const b of budgets) {
        if (cats[b.cat]) {
            await db.query(
                `INSERT INTO budgets (user_id, category_id, monthly_limit)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, category_id) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`,
                [userId, cats[b.cat], b.limit]
            );
        }
    }
    console.log('✓ Monthly budgets seeded');
    console.log('\n✅ Seed complete! Login with: admin@finvault.com / password123');
    process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
