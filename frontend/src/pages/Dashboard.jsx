import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import axios from 'axios';
import {
    LogOut, Download, ArrowUpRight, ArrowDownRight, BellRing,
    Wallet, Activity, CreditCard, LayoutDashboard, History,
    TrendingUp as TrendIcon, TrendingDown, Plus, X, AlertTriangle,
    RefreshCw, Send
} from 'lucide-react';

// ─── Lazy-load Chart components to prevent Chart.js internal crash on init ───
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const API = '/api';
const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#4f46e5', '#8b5cf6', '#ef4444', '#14b8a6'];

// ─── Safe Chart wrappers — use `key` to force full remount on new data ────────
function SafeBar({ chartData }) {
    if (!chartData || !Array.isArray(chartData.labels) || chartData.labels.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-3">
                <Activity className="w-10 h-10 text-zinc-800 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700">Add transactions to see trends</p>
            </div>
        );
    }
    const key = chartData.labels.join(',');
    return (
        <Bar
            key={key}
            options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#09090b', padding: 12, cornerRadius: 12, titleColor: '#fff', bodyColor: '#a1a1aa' } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#52525b', font: { size: 10, weight: '700' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { color: '#52525b', font: { size: 10, weight: '700' }, callback: v => '$' + v } }
                }
            }}
            data={chartData}
        />
    );
}

function SafePie({ chartData }) {
    if (!chartData || !Array.isArray(chartData.labels) || chartData.labels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 h-full">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-zinc-800 flex items-center justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 text-center px-2">No Expense Data</p>
                </div>
            </div>
        );
    }
    const key = chartData.labels.join(',');
    return (
        <Pie
            key={key}
            options={{
                responsive: true, maintainAspectRatio: false, cutout: '80%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#71717a', usePointStyle: true, padding: 16, font: { size: 10, weight: '700' } } },
                    tooltip: { backgroundColor: '#09090b', padding: 12, cornerRadius: 12 }
                }
            }}
            data={chartData}
        />
    );
}

// ─── Modal Component ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div
                className="relative z-10 w-full max-w-md vault-card p-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white">{title}</h3>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user, token } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [transactions, setTx] = useState([]);
    const [pieData, setPie] = useState(null);
    const [barData, setBar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [alerts, setAlerts] = useState([]);

    // Modals
    const [modal, setModal] = useState(null); // 'deposit' | 'withdraw' | 'transfer' | 'addtx'
    const [formAmount, setFAmt] = useState('');
    const [formEmail, setFEmail] = useState('');
    const [formDesc, setFDesc] = useState('');
    const [formType, setFType] = useState('expense');
    const [formCat, setFCat] = useState('');
    const [submitting, setSub] = useState(false);
    const [feedback, setFeedback] = useState('');

    const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // ─ Data Fetch ─────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const [balR, pieR, barR, txR] = await Promise.allSettled([
                axios.get(`${API}/banking/balance`, auth()),
                axios.get(`${API}/finance/analytics/spending`, auth()),
                axios.get(`${API}/finance/analytics/trends`, auth()),
                axios.get(`${API}/finance/transactions?limit=10`, auth()),
            ]);

            if (balR.status === 'fulfilled') setBalance(Number(balR.value.data?.balance) || 0);
            if (txR.status === 'fulfilled') setTx(txR.value.data?.data || []);

            // Pie — strictly build a new object only when data is confirmed valid
            if (pieR.status === 'fulfilled' && Array.isArray(pieR.value.data) && pieR.value.data.length > 0) {
                const rows = pieR.value.data;
                const newPie = {
                    labels: rows.map(d => String(d.name || 'Misc')),
                    datasets: [{ data: rows.map(d => Number(d.total) || 0), backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 10 }]
                };
                setPie(newPie);

                // Budget alerts — flag any category over $1000
                const exceeded = rows.filter(d => Number(d.total) > 1000);
                setAlerts(exceeded);
            } else {
                setPie(null);
                setAlerts([]);
            }

            // Bar — strictly build a new object
            if (barR.status === 'fulfilled' && Array.isArray(barR.value.data) && barR.value.data.length > 0) {
                const rows = barR.value.data;
                const months = [...new Set(rows.map(d => d.month))].sort();
                const newBar = {
                    labels: months,
                    datasets: [
                        { label: 'Income', data: months.map(m => Number(rows.find(d => d.month === m && d.type === 'income')?.total) || 0), backgroundColor: '#6366f1', borderRadius: 8, barThickness: 14 },
                        { label: 'Expense', data: months.map(m => Number(rows.find(d => d.month === m && d.type === 'expense')?.total) || 0), backgroundColor: '#ec4899', borderRadius: 8, barThickness: 14 },
                    ]
                };
                setBar(newBar);
            } else {
                setBar(null);
            }
        } catch (e) {
            console.error('Dashboard fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, auth]);

    useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

    const refresh = () => setRefreshKey(k => k + 1);

    // ─ Actions ────────────────────────────────────────────────────────────────
    const closeModal = () => { setModal(null); setFAmt(''); setFEmail(''); setFDesc(''); setFCat(''); setFeedback(''); };

    const handleDeposit = async () => {
        if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) return setFeedback('Enter a valid amount.');
        setSub(true);
        try {
            // First ensure account exists
            await axios.post(`${API}/banking/account`, {}, auth()).catch(() => { });
            await axios.post(`${API}/banking/deposit`, { amount: Number(formAmount) }, auth());
            setFeedback('✓ Deposit successful!');
            setTimeout(() => { closeModal(); refresh(); }, 1200);
        } catch (e) { setFeedback(e.response?.data?.error || 'Deposit failed.'); }
        setSub(false);
    };

    const handleWithdraw = async () => {
        if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) return setFeedback('Enter a valid amount.');
        setSub(true);
        try {
            await axios.post(`${API}/banking/withdraw`, { amount: Number(formAmount) }, auth());
            setFeedback('✓ Withdrawal successful!');
            setTimeout(() => { closeModal(); refresh(); }, 1200);
        } catch (e) { setFeedback(e.response?.data?.error || 'Withdrawal failed.'); }
        setSub(false);
    };

    const handleTransfer = async () => {
        if (!formAmount || !formEmail) return setFeedback('All fields required.');
        setSub(true);
        try {
            await axios.post(`${API}/banking/transfer`, { amount: Number(formAmount), to_user_email: formEmail }, auth());
            setFeedback('✓ Transfer successful!');
            setTimeout(() => { closeModal(); refresh(); }, 1200);
        } catch (e) { setFeedback(e.response?.data?.error || 'Transfer failed.'); }
        setSub(false);
    };

    const handleAddTx = async () => {
        if (!formAmount || !formDesc) return setFeedback('Amount and description required.');
        setSub(true);
        try {
            await axios.post(`${API}/finance/transactions`, { amount: Number(formAmount), type: formType, description: formDesc, category: formCat || undefined }, auth());
            setFeedback('✓ Transaction added!');
            setTimeout(() => { closeModal(); refresh(); }, 1200);
        } catch (e) { setFeedback(e.response?.data?.error || 'Failed to add transaction.'); }
        setSub(false);
    };

    const handleLogout = () => { dispatch(logout()); navigate('/'); };
    const handleExport = () => { window.open(`${API}/finance/transactions/export`, '_blank'); };

    // ─ Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="app-container flex min-h-screen text-white font-sans overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-black/50 border-r border-white/5 p-8 backdrop-blur-3xl z-30">
                <div className="flex items-center gap-3 mb-16">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-heading text-xl font-black tracking-tight text-white">FinVault</span>
                </div>
                <nav className="flex-1 space-y-2">
                    {[
                        { icon: LayoutDashboard, label: 'Dashboard', active: true },
                        { icon: History, label: 'Activity', active: false },
                        { icon: TrendIcon, label: 'Analytics', active: false },
                        { icon: CreditCard, label: 'Cards', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                        <button key={label} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${active ? 'bg-white/8 text-white border border-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/4'}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto pt-8 border-t border-white/5 space-y-3">
                    <div className="px-5 py-3 rounded-2xl bg-white/4 border border-white/5">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Logged in as</p>
                        <p className="text-xs font-bold text-zinc-300 truncate">{user?.email || 'User'}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 text-red-400 bg-red-500/8 px-5 py-3.5 rounded-2xl hover:bg-red-500/15 transition font-bold text-sm border border-red-500/15">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-10 relative z-10">
                {/* BG glow */}
                <div className="fixed top-[5%] right-[5%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[180px] pointer-events-none" />
                <div className="fixed bottom-[5%] left-[15%] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Header */}
                <header className="flex items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="font-heading text-4xl font-black text-white leading-none mb-1">The Vault</h2>
                        <p className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.2em]">Real-time Finance Dashboard</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={refresh} className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/8 flex items-center justify-center hover:border-white/20 transition group" title="Refresh">
                            <RefreshCw className={`w-4 h-4 text-zinc-500 group-hover:text-white transition ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setModal('addtx')} className="neon-btn">
                            <Plus className="w-4 h-4 mr-2" /> Add Transaction
                        </button>
                    </div>
                </header>

                {/* Budget Alerts */}
                {alerts.length > 0 && (
                    <div className="mb-8 space-y-2">
                        {alerts.map(a => (
                            <div key={a.name} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <p className="text-amber-400 text-xs font-bold">Budget Alert: <span className="text-white">{a.name}</span> spending exceeded $1,000 this period (${Number(a.total).toFixed(2)})</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stat Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Balance card */}
                    <div className="vault-card p-8 flex flex-col justify-between stat-gradient-blue relative overflow-hidden group min-h-[220px]">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/6 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none group-hover:opacity-150 transition" />
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Balance</p>
                                <div className="p-2 bg-white/15 rounded-xl"><Wallet className="w-4 h-4 text-white" /></div>
                            </div>
                            <h3 className="font-heading text-5xl font-black text-white tracking-tight leading-none mb-6">
                                <span className="text-xl opacity-50">$</span>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setModal('deposit'); setFeedback(''); }} className="flex-1 bg-white/20 hover:bg-white/30 border border-white/20 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5">
                                <ArrowDownRight className="w-4 h-4" /> Deposit
                            </button>
                            <button onClick={() => { setModal('withdraw'); setFeedback(''); }} className="flex-1 bg-black/20 hover:bg-black/40 border border-white/10 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4" /> Withdraw
                            </button>
                        </div>
                    </div>

                    {/* Stock monitor / transfer card */}
                    <div className="vault-card p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-500" /> Index Tracker
                            </h4>
                            <span className="text-[10px] text-emerald-400 font-black px-2 py-1 bg-emerald-500/10 rounded-lg">LIVE</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black text-[10px]">AAPL</div>
                                <div>
                                    <p className="font-bold text-sm text-white">Apple Inc.</p>
                                    <p className="text-[10px] text-zinc-600 font-semibold">NASDAQ</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm text-white">$193.45</p>
                                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                                    <TrendIcon className="w-3 h-3" /> +0.82%
                                </p>
                            </div>
                        </div>
                        <button onClick={() => { setModal('transfer'); setFeedback(''); }} className="mt-6 w-full py-3 border border-indigo-500/30 rounded-xl text-xs font-black text-indigo-400 hover:bg-indigo-500/10 transition flex items-center justify-center gap-2">
                            <Send className="w-3.5 h-3.5" /> Transfer Funds
                        </button>
                    </div>

                    {/* Transactions feed */}
                    <div className="vault-card p-0 flex flex-col overflow-hidden">
                        <div className="px-7 py-5 border-b border-white/5 flex justify-between items-center shrink-0">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Activity</h4>
                            <button onClick={handleExport} title="Export CSV" className="text-zinc-600 hover:text-white transition">
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                            {!loading && transactions.length > 0 ? transactions.slice(0, 6).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${tx.type === 'income' ? 'bg-emerald-500/12 border border-emerald-500/15' : 'bg-pink-500/12 border border-pink-500/15'}`}>
                                            {tx.type === 'income' ? <TrendIcon className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-pink-400" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-zinc-200 group-hover:text-white transition leading-tight">{tx.description}</p>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">
                                                {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {tx.category || 'General'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-xs ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full py-8 text-zinc-800">
                                    <History className="w-8 h-8 opacity-10 mb-2" />
                                    <p className="text-[9px] uppercase tracking-widest opacity-20 font-black">Empty Ledger</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Bar chart */}
                    <div className="lg:col-span-3 vault-card p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-white">Monthly Cash Flow</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Income</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500 inline-block"></span> Expense</span>
                            </div>
                        </div>
                        <div className="h-[260px]">
                            {/* Only render Bar when not loading */}
                            {!loading && <SafeBar chartData={barData} />}
                            {loading && <div className="h-full flex items-center justify-center"><RefreshCw className="w-6 h-6 text-zinc-800 animate-spin" /></div>}
                        </div>
                    </div>

                    {/* Pie chart */}
                    <div className="lg:col-span-2 vault-card p-8">
                        <h3 className="text-lg font-black text-white mb-8">Spending by Category</h3>
                        <div className="h-[260px] relative flex items-center justify-center">
                            {/* Only render Pie when not loading */}
                            {!loading && <SafePie chartData={pieData} />}
                            {loading && <RefreshCw className="w-6 h-6 text-zinc-800 animate-spin" />}
                            {/* Center label */}
                            {!loading && pieData && pieData.labels.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: '60px' }}>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Total</p>
                                    <p className="text-2xl font-black text-white font-heading">
                                        ${pieData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Modals ── */}

            {modal === 'deposit' && (
                <Modal title="Deposit Funds" onClose={closeModal}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-700"
                                placeholder="0.00" autoFocus />
                        </div>
                        {feedback && <p className={`text-xs font-bold ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback}</p>}
                        <button onClick={handleDeposit} disabled={submitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition disabled:opacity-50">
                            {submitting ? 'Processing...' : 'Confirm Deposit'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'withdraw' && (
                <Modal title="Withdraw Funds" onClose={closeModal}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-pink-500 transition placeholder-zinc-700"
                                placeholder="0.00" autoFocus />
                        </div>
                        {feedback && <p className={`text-xs font-bold ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback}</p>}
                        <button onClick={handleWithdraw} disabled={submitting} className="w-full py-3.5 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl transition disabled:opacity-50">
                            {submitting ? 'Processing...' : 'Confirm Withdrawal'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'transfer' && (
                <Modal title="Transfer Funds" onClose={closeModal}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Recipient Email</label>
                            <input type="email" value={formEmail} onChange={e => setFEmail(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-700"
                                placeholder="user@example.com" autoFocus />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-700"
                                placeholder="0.00" />
                        </div>
                        {feedback && <p className={`text-xs font-bold ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback}</p>}
                        <button onClick={handleTransfer} disabled={submitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition disabled:opacity-50">
                            {submitting ? 'Processing...' : 'Send Transfer'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'addtx' && (
                <Modal title="Add Transaction" onClose={closeModal}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {['income', 'expense'].map(t => (
                                <button key={t} onClick={() => setFType(t)}
                                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition border ${formType === t ? (t === 'income' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-pink-500/20 border-pink-500/40 text-pink-400') : 'bg-zinc-900 border-white/8 text-zinc-500 hover:border-white/20'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Amount</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-700"
                                placeholder="0.00" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Description</label>
                            <input type="text" value={formDesc} onChange={e => setFDesc(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-700"
                                placeholder="e.g. Grocery, Salary..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Category (optional)</label>
                            <select value={formCat} onChange={e => setFCat(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition">
                                <option value="">Select Category</option>
                                <option>Food</option><option>Rent</option><option>Travel</option>
                                <option>Utilities</option><option>Entertainment</option><option>Health</option>
                                <option>Shopping</option><option>Salary</option><option>Investment</option>
                            </select>
                        </div>
                        {feedback && <p className={`text-xs font-bold ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback}</p>}
                        <button onClick={handleAddTx} disabled={submitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Add Transaction'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
