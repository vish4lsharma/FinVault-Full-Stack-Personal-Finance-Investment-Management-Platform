import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler, PointElement, LineElement } from 'chart.js';
import axios from 'axios';
import { LogOut, Download, Plus, ArrowUpRight, ArrowDownRight, BellRing, User, Wallet, Activity, CreditCard, ChevronRight } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler, PointElement, LineElement);

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [pieData, setPieData] = useState({ labels: [], datasets: [] });
    const [barData, setBarData] = useState({ labels: [], datasets: [] });
    const [balance, setBalance] = useState(0);
    const chartRef = useRef();

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
                    setBalance(balRes.data.balance || 0);
                } catch (e) { console.log('No account setup yet') }

                // Fetch Analytics
                const pieRes = await axios.get(`${API_URL}/finance/analytics/spending`, config);
                const barRes = await axios.get(`${API_URL}/finance/analytics/trends`, config);
                const transRes = await axios.get(`${API_URL}/finance/transactions?limit=5`, config);

                setTransactions(transRes.data.data);

                // Stunning color palette for charts
                const pColors = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ef4444', '#14b8a6'];

                setPieData({
                    labels: pieRes.data.map((d) => d.name),
                    datasets: [{
                        data: pieRes.data.map((d) => d.total),
                        backgroundColor: pColors,
                        hoverOffset: 8,
                        borderWidth: 2,
                        borderColor: '#050505',
                    }]
                });

                const months = [...new Set(barRes.data.map(d => d.month))];
                const incomes = months.map(m => barRes.data.find(d => d.month === m && d.type === 'income')?.total || 0);
                const expenses = months.map(m => barRes.data.find(d => d.month === m && d.type === 'expense')?.total || 0);

                setBarData({
                    labels: months,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomes,
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderRadius: 6,
                            hoverBackgroundColor: '#10b981'
                        },
                        {
                            label: 'Expense',
                            data: expenses,
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            borderRadius: 6,
                            hoverBackgroundColor: '#ef4444'
                        },
                    ]
                });
            } catch (err) {
                console.error(err);
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
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative">

            {/* Immersive Background Blur Highlights */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-float pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

            {/* Nav */}
            <nav className="glass sticky top-0 z-50 border-b border-white/5 py-3 px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-heading text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">FINVAULT</h1>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center space-x-2 text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5 shadow-inner">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">Hello, {user?.name || 'Administrator'}</span>
                        </div>
                        <button className="relative p-2 rounded-full hover:bg-white/10 transition group text-gray-400 hover:text-white">
                            <BellRing className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#050505]"></span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 px-4 py-2 rounded-full transition duration-300 font-medium text-sm border border-red-500/20 shadow-inner group"
                        >
                            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 space-y-8 h-[calc(100vh-80px)] overflow-y-auto pb-20 custom-scrollbar">

                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="font-heading text-4xl font-bold text-white mb-2">Portfolio Overview</h2>
                        <p className="text-gray-400 font-medium">Your financial landscape at a glance</p>
                    </div>
                    <button className="glow-btn bg-white hover:bg-gray-100 text-[#050505] font-bold px-6 py-3 rounded-xl shadow-lg flex items-center transition-all transform hover:-translate-y-1">
                        <CreditCard className="w-5 h-5 mr-2" /> Connect Account
                    </button>
                </div>

                {/* Micro-cards metric row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Main Balance Card */}
                    <div className="glass-card p-8 group flex flex-col justify-between min-h-[220px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-gray-400 font-semibold tracking-wide uppercase text-xs">Total Balance</h3>
                                <span className="bg-green-400/10 text-green-400 text-xs px-2 py-1 rounded-md font-bold flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +2.4%</span>
                            </div>
                            <p className="font-heading text-[3.5rem] leading-none font-bold text-white tracking-tight">
                                <span className="text-2xl text-gray-500 align-top mr-1">$</span>
                                {parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/5 border border-white/10 py-3 rounded-xl text-sm font-semibold transition flex justify-center items-center backdrop-blur-md shadow-inner">
                                <ArrowDownRight className="w-4 h-4 mr-2 text-indigo-400" /> Deposit
                            </button>
                            <button className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/5 border border-white/10 py-3 rounded-xl text-sm font-semibold transition flex justify-center items-center backdrop-blur-md shadow-inner">
                                <ArrowUpRight className="w-4 h-4 mr-2 text-gray-400" /> Transfer
                            </button>
                        </div>
                    </div>

                    {/* Activity Mini Chart */}
                    <div className="glass-card p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-gray-400 font-semibold tracking-wide uppercase text-xs flex items-center"><Activity className="w-4 h-4 mr-2 text-pink-400" /> Market Alerts</h3>
                            <button className="text-gray-500 hover:text-white transition"><ChevronRight className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="input-glass p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/5 group transition">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-bold mr-3 shadow-lg">AAPL</div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition">Apple Inc.</h4>
                                        <span className="text-xs text-green-400">Target > $190.00</span>
                                    </div>
                                </div>
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                            </div>

                            <div className="input-glass p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/5 group transition opacity-60 hover:opacity-100">
                                <div className="flex flex-col border-dashed border-2 border-white/10 w-full rounded-lg items-center justify-center py-2 text-gray-400 group-hover:text-white group-hover:border-white/30 transition">
                                    <Plus className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-semibold">New Threshold</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions List */}
                    <div className="glass-card p-0 flex flex-col">
                        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-transparent to-white/5">
                            <h3 className="text-gray-400 font-semibold tracking-wide uppercase text-xs">Recent History</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {transactions.length > 0 ? transactions.slice(0, 3).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center group">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-300'}`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-200">{tx.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-gray-300'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center text-sm text-gray-500 pt-6">No recent transactions synced.</div>
                            )}
                        </div>
                        <button onClick={handleExport} className="w-full text-center p-3 text-xs font-bold text-gray-400 tracking-wider hover:bg-white/5 transition hover:text-white uppercase mt-auto border-t border-white/5">
                            Download CSV Report
                        </button>
                    </div>
                </div>

                {/* Deep Dive Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 glass-card p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-heading font-bold text-white">Cash Flow Trends</h3>
                            <select className="bg-transparent border border-white/10 rounded-lg text-sm text-gray-300 p-2 outline-none focus:border-indigo-500">
                                <option value="year">Past Year</option>
                                <option value="6m">Past 6 Months</option>
                            </select>
                        </div>
                        <div className="h-72 w-full relative">
                            {barData.labels.length > 0 ? (
                                <Bar
                                    ref={chartRef}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'top', align: 'end', labels: { color: '#9ca3af', usePointStyle: true, boxWidth: 8, font: { family: 'Inter', weight: 500 } } },
                                            tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleFont: { family: 'Outfit', size: 14 }, padding: 12, cornerRadius: 8 }
                                        },
                                        scales: {
                                            x: { grid: { display: false, drawBorder: false }, ticks: { color: '#6b7280', font: { family: 'Inter' } } },
                                            y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, border: { dash: [4, 4] }, ticks: { color: '#6b7280', font: { family: 'Inter' }, callback: (v) => '$' + v } }
                                        }
                                    }}
                                    data={barData}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-sm">
                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                    No aggregate data to map
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 glass-card p-8">
                        <h3 className="text-2xl font-heading font-bold text-white mb-6">Categorical Outflow</h3>
                        <div className="h-64 flex justify-center items-center relative">
                            {pieData.labels.length > 0 ? (
                                <Pie
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '70%',
                                        plugins: {
                                            legend: { position: 'bottom', labels: { color: '#9ca3af', usePointStyle: true, padding: 20, font: { family: 'Inter' } } }
                                        }
                                    }}
                                    data={pieData}
                                />
                            ) : (
                                <div className="text-gray-500 text-sm flex flex-col items-center">
                                    <Pie className="w-8 h-8 opacity-20" />
                                    <span className="mt-2">Pending initial expense capture.</span>
                                </div>
                            )}
                            {pieData.labels.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total</span>
                                    <span className="font-heading font-bold text-white text-2xl">${pieData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
