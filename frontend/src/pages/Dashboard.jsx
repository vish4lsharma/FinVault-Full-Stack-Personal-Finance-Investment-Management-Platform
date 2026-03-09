import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler, PointElement, LineElement } from 'chart.js';
import axios from 'axios';
import { LogOut, Download, Plus, ArrowUpRight, ArrowDownRight, BellRing, Wallet, Activity, CreditCard, ChevronRight, LayoutDashboard, History, TrendingUp as TrendIcon, TrendingDown } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler, PointElement, LineElement);

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    // Initialize with strictly valid structures to avoid Chart.js internal property access errors
    const [pieData, setPieData] = useState({
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
    });

    const [barData, setBarData] = useState({
        labels: [],
        datasets: [{ data: [], label: 'Inflow' }, { data: [], label: 'Outflow' }]
    });

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Parallel fetching for performance
                const [balRes, pieRes, barRes, transRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/banking/balance`, config),
                    axios.get(`${API_URL}/finance/analytics/spending`, config),
                    axios.get(`${API_URL}/finance/analytics/trends`, config),
                    axios.get(`${API_URL}/finance/transactions?limit=10`, config)
                ]);

                // Balance check
                if (balRes.status === 'fulfilled') {
                    setBalance(balRes.value.data?.balance || 0);
                }

                // Transactions check
                if (transRes.status === 'fulfilled') {
                    setTransactions(transRes.value.data?.data || []);
                }

                // Pie Data Processing
                if (pieRes.status === 'fulfilled' && Array.isArray(pieRes.value.data) && pieRes.value.data.length > 0) {
                    const pColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#4f46e5', '#8b5cf6', '#ef4444', '#14b8a6'];
                    setPieData({
                        labels: pieRes.value.data.map(d => d.name || 'Misc'),
                        datasets: [{
                            data: pieRes.value.data.map(d => Number(d.total) || 0),
                            backgroundColor: pColors,
                            hoverOffset: 12,
                            borderWidth: 0,
                        }]
                    });
                }

                // Bar Data Processing
                if (barRes.status === 'fulfilled' && Array.isArray(barRes.value.data) && barRes.value.data.length > 0) {
                    const res = barRes.value.data;
                    const months = [...new Set(res.map(d => d.month))];
                    const incomes = months.map(m => res.find(d => d.month === m && d.type === 'income')?.total || 0);
                    const expenses = months.map(m => res.find(d => d.month === m && d.type === 'expense')?.total || 0);

                    setBarData({
                        labels: months,
                        datasets: [
                            {
                                label: 'Inflow',
                                data: incomes.map(Number),
                                backgroundColor: '#6366f1',
                                borderRadius: 8,
                                barThickness: 16
                            },
                            {
                                label: 'Outflow',
                                data: expenses.map(Number),
                                backgroundColor: '#ec4899',
                                borderRadius: 8,
                                barThickness: 16
                            },
                        ]
                    });
                }
            } catch (err) {
                console.error('Core Dashboard Load Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const handleExport = () => {
        window.location.href = `${API_URL}/finance/transactions/export`;
    };

    const hasPieData = pieData.labels && pieData.labels.length > 0;
    const hasBarData = barData.labels && barData.labels.length > 0;

    return (
        <div className="app-container flex min-h-screen text-white font-sans overflow-hidden">

            {/* Sidebar Overlay */}
            <aside className="hidden lg:flex flex-col w-[260px] bg-black/40 border-r border-white/5 p-8 backdrop-blur-3xl z-30">
                <div className="flex items-center gap-3 mb-16">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
                        <LayoutDashboard className="w-6 h-6 text-black" />
                    </div>
                    <h1 className="font-heading text-xl font-black italic tracking-tighter text-white">FinVault</h1>
                </div>

                <nav className="flex-1 space-y-4">
                    <button className="w-full flex items-center gap-4 text-white bg-white/5 px-6 py-4 rounded-2xl border border-white/10 font-bold transition duration-300 transform active:scale-95 shadow-inner">
                        <LayoutDashboard className="w-5 h-5 text-white" /> <span className="text-white">Dashboard</span>
                    </button>
                    <button className="w-full flex items-center gap-4 text-zinc-500 hover:text-white px-6 py-4 rounded-2xl border border-transparent hover:border-white/5 transition duration-300 font-medium">
                        <History className="w-5 h-5 text-zinc-500" /> <span className="text-zinc-500 group-hover:text-white">Activity</span>
                    </button>
                    <button className="w-full flex items-center gap-4 text-zinc-500 hover:text-white px-6 py-4 rounded-2xl border border-transparent hover:border-white/5 transition duration-300 font-medium">
                        <TrendIcon className="w-5 h-5 text-zinc-500" /> <span className="text-zinc-500 group-hover:text-white">Stock Desk</span>
                    </button>
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 text-red-500 bg-red-500/10 px-6 py-4 rounded-2xl hover:bg-red-500/20 transition duration-300 font-bold border border-red-500/20">
                        <LogOut className="w-5 h-5 text-red-500" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Panel */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative z-10 transition-opacity duration-500" style={{ opacity: loading ? 0.5 : 1 }}>

                {/* BG Glows */}
                <div className="fixed top-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none"></div>
                <div className="fixed bottom-[10%] left-[10%] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }}></div>

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="font-heading text-5xl font-black text-white mb-2 leading-none">The Vault</h2>
                        <p className="text-zinc-500 font-semibold uppercase tracking-[0.2em] text-xs">Real-time Encrypted Access</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="neon-btn shadow-2xl shadow-indigo-500/10">Secure Connect +</button>
                    </div>
                </header>

                {/* Top Cards Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

                    <div className="vault-card p-10 min-h-[300px] flex flex-col justify-between stat-gradient-blue relative group">
                        <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-white/5 translate-x-1/2 -rotate-12 blur-3xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <p className="font-bold text-white/60 uppercase tracking-widest text-[10px]">Master Balance</p>
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"><Wallet className="w-5 h-5 text-white" /></div>
                            </div>
                            <h3 className="font-heading text-6xl font-black text-white tracking-tighter leading-none mb-6">
                                <span className="text-2xl font-medium opacity-50 mr-1">$</span>
                                {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/20 py-4 rounded-2xl text-xs font-black transition flex justify-center items-center text-white shadow-lg">
                                Inflow
                            </button>
                            <button className="flex-1 bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 py-4 rounded-2xl text-xs font-black transition flex justify-center items-center text-white shadow-lg">
                                Outflow
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="vault-card p-8 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-500" /> Index Tracker
                                </h4>
                                <span className="text-xs text-emerald-400 font-black px-2 py-1 bg-emerald-500/10 rounded-lg">LIVE</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs">AAPL</div>
                                    <p className="font-bold text-sm text-white">Apple Inc.</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm text-white">$193.45</p>
                                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                                        <TrendIcon className="w-3 h-3 text-emerald-400" /> 0.82%
                                    </p>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 border border-white/10 border-dashed rounded-xl text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition">Manage Monitor</button>
                        </div>

                        <div className="vault-card border-none bg-indigo-600 p-8 flex items-center justify-between group cursor-pointer hover:bg-indigo-500 transition-colors duration-500 shadow-xl shadow-indigo-500/20">
                            <div>
                                <h4 className="text-white/60 font-black uppercase text-[10px] tracking-widest mb-1">Vault Savings</h4>
                                <p className="text-3xl font-black text-white leading-none">$42,910</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-500 shadow-xl border border-white/20 text-white">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="vault-card p-0 flex flex-col bg-zinc-900 shadow-3xl">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-transparent to-white/5 flex justify-between items-center">
                            <h4 className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Operations Feed</h4>
                            <button onClick={handleExport} className="text-zinc-500 hover:text-white transition group"><Download className="w-4 h-4 text-zinc-500 group-hover:text-white transition" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            {!loading && transactions.length > 0 ? transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-pink-500/10 text-pink-500 border border-pink-500/10'}`}>
                                            {tx.type === 'income' ? <TrendIcon className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{tx.description}</p>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {tx.category || 'Core'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-800">
                                    <History className="w-10 h-10 mb-4 opacity-5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-10">Empty Log</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full text-center py-4 text-[10px] font-black tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 uppercase transition-all duration-300 border-t border-white/5">Expand Report</button>
                    </div>
                </div>

                {/* Analytics Section Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    <div className="lg:col-span-3 vault-card p-10 bg-zinc-950/40 backdrop-blur-3xl shadow-none">
                        <h3 className="text-2xl font-black text-white mb-10 leading-none">Flow Analytics</h3>
                        <div className="h-[300px] w-full">
                            {!loading && hasBarData ? (
                                <Bar
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', padding: 16, cornerRadius: 16 } },
                                        scales: {
                                            x: { grid: { display: false }, ticks: { color: '#52525b', font: { weight: 800, size: 10 } } },
                                            y: { grid: { color: 'rgba(255,255,255,0.02)' }, border: { display: false }, ticks: { color: '#52525b', font: { weight: 800, size: 10 }, callback: (v) => '$' + v } }
                                        }
                                    }}
                                    data={barData}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-900">
                                    <Activity className="w-12 h-12 mb-4 opacity-5" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-10">Synchronizing Data Streams...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 vault-card p-10 bg-zinc-950/40 backdrop-blur-3xl shadow-none">
                        <h3 className="text-2xl font-black text-white mb-10 leading-none">Sector Leakage</h3>
                        <div className="h-[260px] flex justify-center items-center relative">
                            {!loading && hasPieData ? (
                                <Pie
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '82%',
                                        plugins: { legend: { position: 'bottom', labels: { color: '#71717a', usePointStyle: true, padding: 25, font: { weight: 800, size: 9 } } } }
                                    }}
                                    data={pieData}
                                />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-900">
                                    <Pie className="w-12 h-12 mb-4 opacity-5" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-10">Awaiting Signal...</p>
                                </div>
                            )}
                            {!loading && hasPieData && pieData.datasets[0]?.data && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-1">Leakage</span>
                                    <span className="font-heading font-black text-white text-3xl">-{pieData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
