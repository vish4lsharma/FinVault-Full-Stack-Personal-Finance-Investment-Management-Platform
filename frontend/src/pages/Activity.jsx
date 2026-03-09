import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    Search, Filter, Download, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, History, Tag
} from 'lucide-react';

const API = '/api';

export default function Activity() {
    const { token } = useSelector(s => s.auth);
    const navigate = useNavigate();

    const [transactions, setTx] = useState([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', category: '', search: '', page: 1 });

    const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchTransactions = useCallback(async () => {
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: 15,
                ...(filters.type && { type: filters.type }),
                ...(filters.category && { category: filters.category }),
                ...(filters.search && { search: filters.search })
            });
            const res = await axios.get(`${API}/finance/transactions?${queryParams}`, auth());
            setTx(res.data.data);
            setMeta(res.data.meta);
        } catch (e) {
            console.error('Activity fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, auth, filters]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const handleExport = () => { window.open(`${API}/finance/transactions/export`, '_blank'); };
    const updateFilter = (data) => setFilters(prev => ({ ...prev, ...data, page: 1 }));
    const changePage = (p) => setFilters(prev => ({ ...prev, page: p }));

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#08080a] text-white">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto pt-24 lg:pt-12">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white leading-none mb-2">Vault Activity</h1>
                        <p className="text-zinc-600 text-xs lg:text-sm font-semibold uppercase tracking-[0.2em]">Transaction Ledger</p>
                    </div>
                    <button onClick={handleExport} className="neon-btn flex items-center gap-2 w-max">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </header>

                {/* Filters Panel */}
                <div className="vault-card p-6 mb-8 bg-zinc-950/40 border-white/5 backdrop-blur-3xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition"
                                value={filters.search}
                                onChange={(e) => updateFilter({ search: e.target.value })}
                            />
                        </div>
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500 transition"
                            value={filters.type}
                            onChange={(e) => updateFilter({ type: e.target.value })}
                        >
                            <option value="">All Flow Types</option>
                            <option value="income">Income (+)</option>
                            <option value="expense">Expense (-)</option>
                        </select>
                        <select
                            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500 transition"
                            value={filters.category}
                            onChange={(e) => updateFilter({ category: e.target.value })}
                        >
                            <option value="">All Sectors</option>
                            <option>Food</option><option>Rent</option><option>Travel</option>
                            <option>Utilities</option><option>Entertainment</option><option>Health</option>
                            <option>Shopping</option><option>Investment</option><option>Salary</option>
                        </select>
                        <div className="flex items-center justify-end gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest sm:col-span-1 lg:col-span-1">
                            <Filter className="w-3.5 h-3.5" /> Filter Matrix
                        </div>
                    </div>
                </div>

                {/* Transactions Ledger - Mobile Layout Alternative could go here, but let's stick to responsive table */}
                <div className="vault-card p-0 overflow-x-auto bg-zinc-950/40 border-white/5 shadow-2xl">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Operation</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Magnitude</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-8 bg-white/[0.01]"></td>
                                    </tr>
                                ))
                            ) : (transactions || []).length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tx.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400' : 'bg-pink-500/10 border-pink-500/10 text-pink-500'}`}>
                                                    {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-zinc-100 group-hover:text-white transition">{tx.description}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${tx.type === 'income' ? 'text-emerald-500/60' : 'text-pink-500/60'}`}>{tx.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                <Tag className="w-3 h-3" /> {tx.category || 'Core'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-semibold text-zinc-500">
                                            {tx.date ? new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-sm tabular-nums tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <History className="w-16 h-16" />
                                            <p className="text-sm font-black uppercase tracking-[0.3em]">No records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between bg-black/20">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                Page {meta.page} / {meta.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={meta.page <= 1}
                                    onClick={() => changePage(meta.page - 1)}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-20 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={meta.page >= meta.totalPages}
                                    onClick={() => changePage(meta.page + 1)}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-20 transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
