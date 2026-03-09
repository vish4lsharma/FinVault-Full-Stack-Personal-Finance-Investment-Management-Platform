import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import axios from 'axios';
import { LogOut, Download, Plus, ArrowUpRight, ArrowDownRight, BellRing } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [pieData, setPieData] = useState({ labels: [], datasets: [] });
    const [barData, setBarData] = useState({ labels: [], datasets: [] });
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
                    setBalance(balRes.data.balance);
                } catch (e) { console.log('No account setup yet') }

                // Fetch Analytics
                const pieRes = await axios.get(`${API_URL}/finance/analytics/spending`, config);
                const barRes = await axios.get(`${API_URL}/finance/analytics/trends`, config);
                const transRes = await axios.get(`${API_URL}/finance/transactions?limit=5`, config);

                setTransactions(transRes.data.data);

                setPieData({
                    labels: pieRes.data.map((d) => d.name),
                    datasets: [{
                        data: pieRes.data.map((d) => d.total),
                        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#0ea5e9', '#6366f1', '#d946ef'],
                        borderWidth: 0,
                    }]
                });

                const months = [...new Set(barRes.data.map(d => d.month))];
                const incomes = months.map(m => barRes.data.find(d => d.month === m && d.type === 'income')?.total || 0);
                const expenses = months.map(m => barRes.data.find(d => d.month === m && d.type === 'expense')?.total || 0);

                setBarData({
                    labels: months,
                    datasets: [
                        { label: 'Income', data: incomes, backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Expense', data: expenses, backgroundColor: '#ef4444', borderRadius: 4 },
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
        <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="glass border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                        <h1 className="text-xl font-bold tracking-tight">FinVault</h1>
                    </div>
                    <span className="hidden md:inline text-gray-400 text-sm pl-4 border-l border-white/20">Welcome back, {user?.name || 'User'}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition"><BellRing className="w-5 h-5 text-gray-300" /></button>
                    <button onClick={handleLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition duration-200">
                        <LogOut className="w-4 h-4" /> <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Total Balance</h3>
                        <p className="text-4xl font-bold text-white mb-4">${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <div className="flex space-x-3">
                            <button className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition flex justify-center items-center"><ArrowUpRight className="w-4 h-4 mr-1 text-green-400" /> Deposit</button>
                            <button className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition flex justify-center items-center"><ArrowDownRight className="w-4 h-4 mr-1 text-red-400" /> Withdraw</button>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-center items-center">
                        <h3 className="text-gray-400 text-sm font-medium mb-4">Quick Transfer</h3>
                        <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 py-3 rounded-lg text-white font-semibold shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-1">Send Money</button>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500 rounded-full blur-[60px] opacity-20"></div>
                        <h3 className="text-gray-400 text-sm font-medium mb-4">Stock Alerts</h3>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg mb-2">
                            <div><p className="font-bold">AAPL</p><p className="text-xs text-gray-400">Target: $190</p></div>
                            <span className="text-green-400 text-sm bg-green-400/10 px-2 py-1 rounded">Active</span>
                        </div>
                        <button className="w-full mt-2 border border-dashed border-white/20 text-gray-300 hover:text-white hover:border-white/40 py-2 rounded-lg text-sm transition flex justify-center items-center"><Plus className="w-4 h-4 mr-1" /> Add Alert</button>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-2xl border border-white/10 shadow-lg">
                        <h3 className="text-xl font-bold mb-6 text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Income vs Expenses</h3>
                        <div className="h-64">
                            {barData.labels.length > 0 ? (
                                <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'gray' } }, y: { ticks: { color: 'gray' } } } }} data={barData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                            )}
                        </div>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-white/10 shadow-lg">
                        <h3 className="text-xl font-bold mb-6 text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Spending by Category</h3>
                        <div className="h-64 flex justify-center">
                            {pieData.labels.length > 0 ? (
                                <Pie options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white' } } } }} data={pieData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="glass rounded-2xl border border-white/10 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-xl font-bold text-gray-100">Recent Transactions</h3>
                        <button onClick={handleExport} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-blue-500/20">
                            <Download className="w-4 h-4" /> <span>Export CSV</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-sm">
                                    <th className="p-4 rounded-tl-lg">Date</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-right rounded-tr-lg">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="p-4 text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-white font-medium">{tx.description}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/5">
                                                {tx.category || 'Transfer'}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">No recent transactions. start by depositing some funds.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
