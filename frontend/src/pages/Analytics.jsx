import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
import {
    TrendingUp, TrendingDown, Clock, ShieldAlert,
    ArrowUpRight, ArrowDownRight, Target, LayoutGrid,
    Zap, Activity, PieChart, BarChart
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const API = '/api';
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#4f46e5', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function Analytics() {
    const { token } = useSelector(s => s.auth);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net: 0, savings_rate: 0 });
    const [pieData, setPie] = useState(null);
    const [barData, setBar] = useState(null);
    const [budgets, setBudgets] = useState([]);

    const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchAnalytics = useCallback(async () => {
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const [sumR, pieR, barR, budR] = await Promise.allSettled([
                axios.get(`${API}/finance/analytics/summary`, auth()),
                axios.get(`${API}/finance/analytics/spending`, auth()),
                axios.get(`${API}/finance/analytics/trends`, auth()),
                axios.get(`${API}/finance/budgets`, auth()),
            ]);

            if (sumR.status === 'fulfilled') setSummary(sumR.value.data);
            if (budR.status === 'fulfilled') setBudgets(budR.value.data);

            if (pieR.status === 'fulfilled' && Array.isArray(pieR.value.data) && pieR.value.data.length > 0) {
                setPie({
                    labels: pieR.value.data.map(d => String(d.name || 'Misc')),
                    datasets: [{ data: pieR.value.data.map(d => Number(d.total)), backgroundColor: COLORS, borderWidth: 0, cutout: '82%' }]
                });
            } else setPie(null);

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

        } catch (e) {
            console.error('Analytics fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, auth]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#08080a] text-white">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto pt-24 lg:pt-12">
                <header className="mb-12">
                    <h1 className="text-3xl lg:text-4xl font-black text-white leading-none mb-2">Vault Intelligence</h1>
                    <p className="text-zinc-600 text-xs lg:text-sm font-semibold uppercase tracking-[0.2em]">Deep Analytic Reports</p>
                </header>

                {/* Summary Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-left">
                    {[
                        { label: 'Net Flow', value: summary.net, icon: Zap, bg: 'bg-indigo-500' },
                        { label: 'Income Yield', value: summary.total_income, icon: TrendingUp, bg: 'bg-emerald-500' },
                        { label: 'Asset Leakage', value: summary.total_expense, icon: TrendingDown, bg: 'bg-pink-500' },
                        { label: 'Savings Rate', value: summary.savings_rate + '%', icon: Activity, bg: 'bg-purple-500' },
                    ].map((s, i) => (
                        <div key={i} className="vault-card p-6 bg-zinc-950/40 border-white/5 relative group overflow-hidden">
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition pointer-events-none ${s.bg}`} />
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 leading-none">{s.label}</span>
                                <s.icon className="w-4 h-4 text-zinc-500" />
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tighter">
                                {typeof s.value === 'number' && s.value >= 0 && '$'}
                                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Main Trend Map */}
                    <div className="lg:col-span-2 vault-card p-6 lg:p-8 bg-zinc-900/10 border-white/5 shadow-inner">
                        <div className="flex items-center gap-3 mb-10">
                            <BarChart className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-base lg:text-lg font-black uppercase tracking-tighter">Flow Velocity</h3>
                        </div>
                        <div className="h-[300px] lg:h-[320px]">
                            {!loading && barData ? (
                                <Bar
                                    data={barData}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#000', padding: 12, cornerRadius: 8 } },
                                        scales: {
                                            x: { grid: { display: false }, ticks: { color: '#3f3f46', font: { weight: 800, size: 10 } } },
                                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#3f3f46', font: { weight: 800, size: 10 }, callback: v => '$' + v } }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-10"><Clock className="w-12 h-12 animate-pulse" /></div>
                            )}
                        </div>
                    </div>

                    {/* Sector Breakdown */}
                    <div className="vault-card p-6 lg:p-8 border-white/5">
                        <div className="flex items-center gap-3 mb-10">
                            <PieChart className="w-5 h-5 text-pink-500" />
                            <h3 className="text-base lg:text-lg font-black uppercase tracking-tighter">Sector Leakage</h3>
                        </div>
                        <div className="h-[240px] relative mb-8 flex items-center justify-center">
                            {!loading && pieData ? (
                                <Pie
                                    data={pieData}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            ) : (
                                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-dashed border-white/5 opacity-10 animate-spin" style={{ animationDuration: '10s' }} />
                            )}
                            {!loading && pieData && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-2 pointer-events-none">
                                    <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Global</span>
                                    <span className="text-xl font-black">${summary.total_expense.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {pieData?.labels?.slice(0, 4).map((label, i) => (
                                <div key={label} className="flex justify-between items-center px-4 py-2.5 bg-white/3 border border-white/5 rounded-xl">
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] || '#555' }} /> {label}
                                    </span>
                                    <span className="text-xs font-black">${pieData.datasets[0].data[i].toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Budget Execution Tracker */}
                <div className="vault-card p-6 lg:p-8 bg-zinc-950/40 border-white/5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-base lg:text-lg font-black uppercase tracking-tighter">Budget Protocol Execution</h3>
                        </div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4 py-1.5 border border-white/5 rounded-full w-max">Monthly Cycle</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {budgets && budgets.length > 0 ? budgets.map((b) => {
                            const percent = Math.min(100, (Number(b.spent) / Number(b.monthly_limit)) * 100);
                            const over = Number(b.spent) > Number(b.monthly_limit);
                            return (
                                <div key={b.id} className="space-y-4 group">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 leading-none">{b.category}</p>
                                            <p className={`text-xl font-black ${over ? 'text-pink-500' : 'text-zinc-200'} tracking-tighter`}>
                                                ${Number(b.spent).toLocaleString()} <span className="text-xs font-bold text-zinc-600">/ ${Number(b.monthly_limit).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-black tabular-nums transition ${over ? 'text-pink-500' : 'text-zinc-600'}`}>{percent.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 group-hover:brightness-125 ${over ? 'bg-pink-600' : 'bg-indigo-600'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    {over && (
                                        <div className="flex items-center gap-2 text-pink-500/80">
                                            <ShieldAlert className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Protocol Breached</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-10 text-center">
                                <LayoutGrid className="w-16 h-16 mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest">No target budgets configured</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
