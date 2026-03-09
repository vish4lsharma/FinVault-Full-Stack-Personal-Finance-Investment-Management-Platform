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
    const [pieData, setPieData] = useState(null);
    const [barData, setBarData] = useState(null);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch Balance
                try {
                    const balRes = await axios.get(`${API_URL}/banking/balance`, config);
                    setBalance(balRes.data?.balance || 0);
                } catch (e) {
                    console.log('Banking balance fallback');
                    setBalance(0);
                }

                // Fetch Analytics
                let pieResults = [];
                let barResults = [];
                let transactionsData = [];

                try {
                    const pieRes = await axios.get(`${API_URL}/finance/analytics/spending`, config);
                    pieResults = pieRes.data || [];
                } catch (e) { console.log('Pie data error'); }

                try {
                    const barRes = await axios.get(`${API_URL}/finance/analytics/trends`, config);
                    barResults = barRes.data || [];
                } catch (e) { console.log('Bar data error'); }

                try {
                    const transRes = await axios.get(`${API_URL}/finance/transactions?limit=10`, config);
                    transactionsData = transRes.data?.data || [];
                } catch (e) { console.log('Transactions data error'); }

                setTransactions(transactionsData);

                // Chart Colors
                const pColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#4f46e5', '#8b5cf6', '#ef4444', '#14b8a6'];

                if (pieResults.length > 0) {
                    setPieData({
                        labels: pieResults.map((d) => d.name || 'Misc'),
                        datasets: [{
                            data: pieResults.map((d) => d.total || 0),
                            backgroundColor: pColors,
                            hoverOffset: 12,
                            borderWidth: 0,
                        }]
                    });
                } else {
                    setPieData(null);
                }

                if (barResults.length > 0) {
                    const months = [...new Set(barResults.map(d => d.month))];
                    const incomes = months.map(m => barResults.find(d => d.month === m && d.type === 'income')?.total || 0);
                    const expenses = months.map(m => barResults.find(d => d.month === m && d.type === 'expense')?.total || 0);

                    setBarData({
                        labels: months,
                        datasets: [
                            {
                                label: 'Inflow',
                                data: incomes,
                                backgroundColor: '#6366f1',
                                borderRadius: 8,
                                hoverBackgroundColor: '#818cf8',
                                barThickness: 16
                            },
                            {
                                label: 'Outflow',
                                data: expenses,
                                backgroundColor: '#ec4899',
                                borderRadius: 8,
                                hoverBackgroundColor: '#f472b6',
                                barThickness: 16
                            },
                        ]
                    });
                } else {
                    setBarData(null);
                }
            } catch (err) {
                console.error('Fatal fetch error:', err);
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

    return (
        <div className="app-container flex min-h-screen text-white font-sans overflow-hidden">

            {/* Sidebar */}
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
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 text-red-500 bg-red-500/10 px-6 py-4 rounded-2xl hover:bg-red-500/20 transition duration-300 font-bold border border-red-500/20"
                    >
                        <LogOut className="w-5 h-5 text-red-500" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Hub */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative z-10">
                <div className="fixed top-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none"></div>
                <div className="fixed bottom-[10%] left-[10%] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }}></div>

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="font-heading text-5xl font-black text-white mb-2 leading-none">The Vault</h2>
                        <p className="text-zinc-500 font-semibold uppercase tracking-[0.2em] text-xs">Synchronized: Real-time Wealth Management</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl hover:border-white/20 transition group">
                            <BellRing className="w-5 h-5 text-zinc-400 group-hover:text-white transition" />
                        </button>
                        <button className="neon-btn shadow-2xl shadow-white/5">
                            Secure Connect +
                        </button>
                    </div>
                </header>

                {/* Global Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

                    <div className="vault-card p-10 min-h-[300px] flex flex-col justify-between stat-gradient-blue relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <p className="font-bold text-white/60 uppercase tracking-widest text-xs">Master Balance</p>
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"><Wallet className="w-5 h-5 text-white" /></div>
                            </div>
                            <h3 className="font-heading text-6xl font-black text-white tracking-tighter leading-none mb-6">
                                <span className="text-2xl font-medium opacity-50 mr-1">$</span>
                                {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/20 py-4 rounded-2xl text-sm font-black transition flex justify-center items-center text-white shadow-lg">
                                <ArrowDownRight className="w-4 h-4 mr-2 text-white" /> <span className="text-white">Inflow</span>
                            </button>
                            <button className="flex-1 bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 py-4 rounded-2xl text-sm font-black transition flex justify-center items-center text-white shadow-lg">
                                <ArrowUpRight className="w-4 h-4 mr-2 text-white" /> <span className="text-white">Outflow</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="vault-card p-8 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-500" /> Stock Monitor
                                </h4>
                                <span className="text-xs text-green-400 font-black px-2 py-1 bg-green-500/10 rounded-lg text-emerald-400">LIVE</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs">AAPL</div>
                                    <p className="font-bold text-sm text-white">Apple Inc.</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm text-white">$193.45</p>
                                    <p className="text-[10px] text-green-400 font-bold flex items-center gap-1 justify-end text-emerald-400">
                                        <TrendIcon className="w-3 h-3 text-emerald-400" /> 0.82%
                                    </p>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 border border-white/10 border-dashed rounded-xl text-zinc-500 hover:text-white hover:border-white/30 transition text-xs font-bold uppercase tracking-widest">
                                Manage AlertsDesk
                            </button>
                        </div>

                        <div className="vault-card border-none bg-indigo-600 p-8 flex items-center justify-between group cursor-pointer hover:bg-indigo-500 transition-colors duration-500">
                            <div>
                                <h4 className="text-white/60 font-black uppercase text-[10px] tracking-widest mb-1">Total Savings</h4>
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
                            <button onClick={handleExport} className="text-zinc-500 hover:text-white transition"><Download className="w-4 h-4 text-zinc-500" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            {transactions && transactions.length > 0 ? transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${tx.type === 'income' ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-pink-500/10 text-pink-500 border border-pink-500/10'}`}>
                                            {tx.type === 'income' ? <TrendIcon className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-pink-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-zinc-200 group-hover:text-white transition">{tx.description}</p>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {tx.category || 'System'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm tracking-tighter ${tx.type === 'income' ? 'text-green-400' : 'text-zinc-300'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-700">
                                    <History className="w-10 h-10 mb-4 opacity-10 text-zinc-700" />
                                    <p className="text-xs font-black uppercase tracking-widest opacity-20 text-zinc-700">No operations found</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full text-center py-4 text-[10px] font-black tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 uppercase transition-all duration-300 border-t border-white/5">
                            Expand Full Ledger Ledger
                        </button>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 vault-card p-10 bg-zinc-950/40 backdrop-blur-3xl shadow-none">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-white leading-none">Cash Flow Analysis</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            {barData && barData.labels && barData.labels.length > 0 ? (
                                <Bar
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'Outfit', size: 14, weight: 800 }, padding: 16, cornerRadius: 16 }
                                        },
                                        scales: {
                                            x: { grid: { display: false }, ticks: { color: '#52525b', font: { family: 'Inter', weight: 600, size: 10 } } },
                                            y: { grid: { color: 'rgba(255,255,255,0.02)' }, border: { display: false }, ticks: { color: '#52525b', font: { family: 'Inter', weight: 600, size: 10 }, callback: (v) => '$' + v } }
                                        }
                                    }}
                                    data={barData}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                                    <Activity className="w-12 h-12 mb-4 opacity-5 text-zinc-800" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-10 text-zinc-800">Deep analytical data pending</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 vault-card p-10 bg-zinc-950/40 backdrop-blur-3xl shadow-none">
                        <h3 className="text-2xl font-black text-white mb-10 leading-none">Capital Leakage</h3>
                        <div className="h-[260px] flex justify-center items-center relative">
                            {pieData && pieData.labels && pieData.labels.length > 0 ? (
                                <Pie
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '80%',
                                        plugins: {
                                            legend: { position: 'bottom', labels: { color: '#71717a', usePointStyle: true, pointStyle: 'circle', padding: 25, font: { family: 'Inter', weight: 600, size: 10 } } }
                                        }
                                    }}
                                    data={pieData}
                                />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-800">
                                    <Pie className="w-12 h-12 mb-4 opacity-5 text-zinc-800" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-10 text-zinc-800">Waiting for data</p>
                                </div>
                            )}
                            {pieData && pieData.labels && pieData.labels.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1 text-zinc-600">Leakage</span>
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
