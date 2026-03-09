import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    LogOut, Download, ArrowUpRight, ArrowDownRight, BellRing,
    Wallet, Activity, CreditCard, LayoutDashboard, History,
    TrendingUp as TrendIcon, TrendingDown, Plus, X, AlertTriangle,
    RefreshCw, Send
} from 'lucide-react';

// ─── Lazy-load Chart components ───
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
                    x: { grid: { display: false }, ticks: { color: '#3f3f46', font: { size: 10, weight: '800' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, border: { display: false }, ticks: { color: '#3f3f46', font: { size: 10, weight: '800' }, callback: v => '$' + v } }
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
                responsive: true, maintainAspectRatio: false, cutout: '82%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#52525b', usePointStyle: true, padding: 20, font: { size: 10, weight: '800' } } },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md vault-card p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition duration-700" />
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-white">{title}</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition group/x">
                        <X className="w-5 h-5 text-zinc-500 group-hover/x:text-white transition" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user, token } = useSelector(s => s.auth);
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [transactions, setTx] = useState([]);
    const [stocks, setStocks] = useState([]);
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
            const [balR, pieR, barR, txR, stockR] = await Promise.allSettled([
                axios.get(`${API}/banking/balance`, auth()),
                axios.get(`${API}/finance/analytics/spending`, auth()),
                axios.get(`${API}/finance/analytics/trends`, auth()),
                axios.get(`${API}/finance/transactions?limit=10`, auth()),
                axios.get(`${API}/finance/stocks`, auth()),
            ]);

            if (balR.status === 'fulfilled') setBalance(Number(balR.value.data?.balance) || 0);
            if (txR.status === 'fulfilled') setTx(txR.value.data?.data || []);
            if (stockR.status === 'fulfilled') setStocks(stockR.value.data || []);

            if (pieR.status === 'fulfilled' && Array.isArray(pieR.value.data) && pieR.value.data.length > 0) {
                const rows = pieR.value.data;
                setPie({
                    labels: rows.map(d => String(d.name || 'Misc')),
                    datasets: [{ data: rows.map(d => Number(d.total) || 0), backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 15 }]
                });
                const exceeded = rows.filter(d => Number(d.total) > 1000);
                setAlerts(exceeded);
            } else { setPie(null); setAlerts([]); }

            if (barR.status === 'fulfilled' && Array.isArray(barR.value.data) && barR.value.data.length > 0) {
                const rows = barR.value.data;
                const months = [...new Set(rows.map(d => d.month))].sort();
                setBar({
                    labels: months,
                    datasets: [
                        { label: 'Income', data: months.map(m => Number(rows.find(d => d.month === m && d.type === 'income')?.total) || 0), backgroundColor: '#6366f1', borderRadius: 8, barThickness: 16 },
                        { label: 'Expense', data: months.map(m => Number(rows.find(d => d.month === m && d.type === 'expense')?.total) || 0), backgroundColor: '#ec4899', borderRadius: 8, barThickness: 16 },
                    ]
                });
            } else setBar(null);
        } catch (e) { console.error('Dashboard fetch error:', e); } finally { setLoading(false); }
    }, [token, navigate, auth]);

    useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

    const refresh = () => setRefreshKey(k => k + 1);
    const closeModal = () => { setModal(null); setFAmt(''); setFEmail(''); setFDesc(''); setFCat(''); setFeedback(''); };

    const handleAction = async (endpoint, payload, successMsg) => {
        if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) return setFeedback('Enter a valid amount.');
        setSub(true);
        try {
            if (endpoint === '/banking/deposit') { await axios.post(`${API}/banking/account`, {}, auth()).catch(() => { }); }
            await axios.post(`${API}${endpoint}`, payload, auth());
            setFeedback(`✓ ${successMsg}`);
            setTimeout(() => { closeModal(); refresh(); }, 1200);
        } catch (e) { setFeedback(e.response?.data?.error || 'Operation failed.'); }
        setSub(false);
    };

    const handleExport = () => { window.open(`${API}/finance/transactions/export`, '_blank'); };

    return (
        <div className="flex min-h-screen bg-[#08080a] text-white">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative z-10 transition-opacity duration-500" style={{ opacity: loading ? 0.7 : 1 }}>

                {/* BG Glows */}
                <div className="fixed top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[180px] pointer-events-none" />
                <div className="fixed bottom-[10%] left-[10%] w-[400px] h-[400px] bg-pink-600/4 rounded-full blur-[150px] pointer-events-none" />

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <h2 className="font-heading text-5xl font-black text-white leading-none mb-3">The Vault</h2>
                        <p className="text-zinc-600 font-bold uppercase tracking-[0.25em] text-[10px]">Financial Intelligence Vector</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={refresh} className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-white/5 transition group">
                            <RefreshCw className={`w-5 h-5 text-zinc-600 group-hover:text-white transition ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setModal('addtx')} className="neon-btn h-12 flex items-center">
                            <Plus className="w-5 h-5 mr-3" /> Add Transaction
                        </button>
                    </div>
                </header>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="mb-10 space-y-4">
                        {alerts.map(a => (
                            <div key={a.name} className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-[24px] px-8 py-4 backdrop-blur-xl">
                                <div className="p-3 bg-amber-500/20 rounded-xl"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
                                <p className="text-sm font-black text-amber-500/80 uppercase tracking-widest">
                                    Budget Breach: <span className="text-white ml-2">{a.name} exceeded $1,000 threshold</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

                    {/* Master Balance Card */}
                    <div className="vault-card p-10 min-h-[280px] flex flex-col justify-between stat-gradient-blue relative group shrink-0">
                        <div className="absolute top-0 right-0 w-[60%] h-[100%] bg-white/10 translate-x-1/2 -rotate-12 blur-3xl pointer-events-none group-hover:opacity-150 transition duration-700" />
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <p className="font-black text-white/50 uppercase tracking-widest text-[10px]">Master Balance</p>
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-lg border border-white/20 shadow-xl"><Wallet className="w-6 h-6 text-white" /></div>
                            </div>
                            <h3 className="font-heading text-6xl font-black text-white tracking-tighter leading-none mb-10">
                                <span className="text-2xl font-medium opacity-50 mr-1">$</span>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setModal('deposit')} className="flex-1 bg-white/25 hover:bg-white/35 backdrop-blur-2xl border border-white/20 py-4 rounded-2xl text-[10px] font-black transition flex items-center justify-center gap-2 text-white shadow-xl transform active:scale-95">
                                <ArrowDownRight className="w-4 h-4" /> Deposit
                            </button>
                            <button onClick={() => setModal('withdraw')} className="flex-1 bg-black/25 hover:bg-black/40 backdrop-blur-2xl border border-white/10 py-4 rounded-2xl text-[10px] font-black transition flex items-center justify-center gap-2 text-white shadow-xl transform active:scale-95">
                                <ArrowUpRight className="w-4 h-4" /> Withdraw
                            </button>
                        </div>
                    </div>

                    {/* Market Tracker */}
                    <div className="flex flex-col gap-6">
                        <div className="vault-card p-8 flex-1 flex flex-col justify-between border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-zinc-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 leading-none">
                                    <Activity className="w-4 h-4 text-purple-600" /> Index Tracker
                                </h4>
                                <span className="text-[10px] text-emerald-400 font-black px-3 py-1 bg-emerald-500/10 rounded-lg">LIVE FEED</span>
                            </div>
                            <div className="space-y-6">
                                {stocks.length > 0 ? stocks.slice(0, 1).map((s) => (
                                    <div key={s.ticker} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-black text-xs shadow-2xl">{s.ticker}</div>
                                            <div>
                                                <p className="font-black text-sm text-white">{s.name}</p>
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">NASDAQ • USD</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-white tabular-nums">${s.price.toLocaleString()}</p>
                                            <p className={`text-[10px] font-black flex items-center gap-1 justify-end mt-1 ${s.direction === 'up' ? 'text-emerald-400' : 'text-pink-500'}`}>
                                                {s.direction === 'up' ? <TrendIcon className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {s.change}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex items-center justify-between opacity-20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center font-black text-xs">...</div>
                                            <p className="text-xs font-bold text-zinc-600">AWAITING FEED</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setModal('transfer')} className="w-full mt-6 py-4 bg-indigo-600/5 hover:bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-3">
                                <Send className="w-4 h-4" /> Initiate Peer Transfer
                            </button>
                        </div>

                        <div className="vault-card border-none bg-indigo-600 p-8 flex items-center justify-between group cursor-pointer hover:scale-[1.01] transition-all duration-500 shadow-3xl shadow-indigo-600/20">
                            <div>
                                <h4 className="text-white/60 font-black uppercase text-[10px] tracking-widest mb-1.5 leading-none">Credit Limit Available</h4>
                                <p className="text-3xl font-black text-white leading-none">$25,000</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition duration-500 shadow-2xl border border-white/30 text-white">
                                <CreditCard className="w-7 h-7" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Feed */}
                    <div className="vault-card p-0 flex flex-col border-white/5 bg-zinc-950/40">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
                            <h4 className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">Operations Feed</h4>
                            <button onClick={handleExport} className="text-zinc-600 hover:text-white transition group flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:inline hidden">CSV</span>
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            {!loading && transactions.length > 0 ? transactions.slice(0, 6).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20'}`}>
                                            {tx.type === 'income' ? <TrendIcon className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-zinc-200 group-hover:text-white transition">{tx.description}</p>
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-0.5">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {tx.category || 'Core'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm tracking-tight pt-1 ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-800 opacity-20">
                                    <History className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Empty Ledger</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => navigate('/activity')} className="w-full text-center py-5 text-[10px] font-black tracking-[0.3em] text-zinc-600 hover:text-white hover:bg-white/5 uppercase transition-all duration-300 border-t border-white/5">Full Access Report</button>
                    </div>
                </div>

                {/* Analytics Section Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    <div className="lg:col-span-3 vault-card p-10 bg-zinc-950/40 border-white/5 shadow-none group">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Flow Velocity</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Inflow</span></div>
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-pink-500" /> <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Outflow</span></div>
                            </div>
                        </div>
                        <div className="h-[340px] w-full group-hover:brightness-110 transition duration-500">
                            {!loading && <SafeBar chartData={barData} />}
                        </div>
                    </div>

                    <div className="lg:col-span-2 vault-card p-10 bg-zinc-950/40 border-white/5 shadow-none">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-10">Sector Leakage</h3>
                        <div className="h-[280px] flex justify-center items-center relative">
                            {!loading && <SafePie chartData={pieData} />}
                            {!loading && pieData && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-[60px]">
                                    <span className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mb-1">Global Total</span>
                                    <span className="font-heading font-black text-white text-3xl">-${pieData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Modals ── */}
            {modal === 'deposit' && (
                <Modal title="Deposit Funds" onClose={closeModal}>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg focus:outline-none focus:border-indigo-500 transition placeholder-zinc-800"
                                placeholder="0.00" autoFocus />
                        </div>
                        {feedback && <p className={`text-xs font-black uppercase tracking-widest text-center ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-pink-500'}`}>{feedback}</p>}
                        <button onClick={() => handleAction('/banking/deposit', { amount: Number(formAmount) }, 'Deposit successful')} disabled={submitting} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition disabled:opacity-50 transform active:scale-95 shadow-2xl shadow-indigo-600/20">
                            {submitting ? 'Authenticating...' : 'Authorize Deposit'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'withdraw' && (
                <Modal title="Withdraw Funds" onClose={closeModal}>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg focus:outline-none focus:border-pink-500 transition placeholder-zinc-800"
                                placeholder="0.00" autoFocus />
                        </div>
                        {feedback && <p className={`text-xs font-black uppercase tracking-widest text-center ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-pink-500'}`}>{feedback}</p>}
                        <button onClick={() => handleAction('/banking/withdraw', { amount: Number(formAmount) }, 'Withdrawal successful')} disabled={submitting} className="w-full py-5 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-2xl transition disabled:opacity-50 transform active:scale-95 shadow-2xl shadow-pink-600/20">
                            {submitting ? 'Authenticating...' : 'Authorize Withdrawal'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'transfer' && (
                <Modal title="Peer Transfer" onClose={closeModal}>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Recipient Identifier (Email)</label>
                            <input type="email" value={formEmail} onChange={e => setFEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-800"
                                placeholder="recipient@finvault.com" autoFocus />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-1">Amount (USD)</label>
                            <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg focus:outline-none focus:border-indigo-500 transition placeholder-zinc-800"
                                placeholder="0.00" />
                        </div>
                        {feedback && <p className={`text-xs font-black uppercase tracking-widest text-center ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-pink-500'}`}>{feedback}</p>}
                        <button onClick={() => handleAction('/banking/transfer', { amount: Number(formAmount), to_user_email: formEmail }, 'Transfer successful')} disabled={submitting} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition disabled:opacity-50 transform active:scale-95 shadow-2xl shadow-indigo-600/20">
                            {submitting ? 'Locking Assets...' : 'Authorize Asset Transfer'}
                        </button>
                    </div>
                </Modal>
            )}

            {modal === 'addtx' && (
                <Modal title="Add Logic Transaction" onClose={closeModal}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {['income', 'expense'].map(t => (
                                <button key={t} onClick={() => setFType(t)}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition border ${formType === t ? (t === 'income' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-pink-500/20 border-pink-500/30 text-pink-500') : 'bg-black/40 border-white/8 text-zinc-700 hover:border-white/20'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 pl-1 block mb-2">Magnitude</label>
                                <input type="number" min="0.01" step="0.01" value={formAmount} onChange={e => setFAmt(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-lg focus:outline-none focus:border-indigo-500 transition placeholder-zinc-800"
                                    placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 pl-1 block mb-2">Operation Description</label>
                                <input type="text" value={formDesc} onChange={e => setFDesc(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition placeholder-zinc-800"
                                    placeholder="e.g. AWS Cloud Subscription" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 pl-1 block mb-2">Asset Sector</label>
                                <select value={formCat} onChange={e => setFCat(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-[10px] uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition appearance-none">
                                    <option value="">UNCATEGORIZED</option>
                                    <option>Food</option><option>Rent</option><option>Travel</option>
                                    <option>Utilities</option><option>Entertainment</option><option>Health</option>
                                    <option>Shopping</option><option>Investment</option><option>Salary</option>
                                </select>
                            </div>
                        </div>
                        {feedback && <p className={`text-xs font-black uppercase tracking-widest text-center ${feedback.startsWith('✓') ? 'text-emerald-400' : 'text-pink-500'}`}>{feedback}</p>}
                        <button onClick={() => handleAction('/finance/transactions', { amount: Number(formAmount), type: formType, description: formDesc, category: formCat || undefined }, 'Transaction added')} disabled={submitting} className="w-full py-5 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl transition disabled:opacity-50 transform active:scale-95 shadow-3xl">
                            {submitting ? 'Registering...' : 'Register Operation'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
