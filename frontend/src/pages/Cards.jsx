import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
    CreditCard, ShieldCheck, Zap, ArrowRight,
    Send, RefreshCw, Layers, Lock, Cpu, History
} from 'lucide-react';

const API = '/api';

export default function Cards() {
    const { user, token } = useSelector(s => s.auth);
    const navigate = useNavigate();

    const [acc, setAcc] = useState({ balance: 0, id: '' });
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);

    const auth = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchBanking = useCallback(async () => {
        if (!token) { navigate('/'); return; }
        setLoading(true);
        try {
            const [accR, transR] = await Promise.allSettled([
                axios.get(`${API}/banking/account`, auth()),
                axios.get(`${API}/banking/transfers`, auth()),
            ]);
            if (accR.status === 'fulfilled') setAcc(accR.value.data);
            if (transR.status === 'fulfilled') setTransfers(transR.value.data);
        } catch (e) {
            console.error('Cards fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, auth]);

    useEffect(() => { fetchBanking(); }, [fetchBanking]);

    const cardNum = acc.id ? acc.id.replace(/-/g, '').substring(0, 16).padEnd(16, '0').match(/.{1,4}/g).join(' ') : '0000 0000 0000 0000';

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#08080a] text-white">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto pt-24 lg:pt-12">
                <header className="mb-12">
                    <h1 className="text-3xl lg:text-4xl font-black text-white leading-none mb-2">Vault Cards</h1>
                    <p className="text-zinc-600 text-xs lg:text-sm font-semibold uppercase tracking-[0.2em]">Secure Asset Access</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">

                    {/* Virtual Card & Limits */}
                    <div className="xl:col-span-3 space-y-10 order-2 xl:order-1">

                        {/* The FinVault Physical Card Mockup */}
                        <div className="relative w-full max-w-[500px] aspect-[1.586/1] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 bg-indigo-600 shadow-2xl shadow-indigo-500/30 overflow-hidden transform transition hover:scale-[1.01] duration-500 mx-auto lg:mx-0 group">
                            {/* Gloss Glows */}
                            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-white/10 translate-x-1/2 -rotate-12 blur-3xl pointer-events-none group-hover:opacity-100 transition duration-700" />
                            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/20 rounded-full blur-2xl" />

                            {/* Card Content */}
                            <div className="relative h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                        <Cpu className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                    </div>
                                    <p className="font-heading text-lg lg:text-xl font-black italic tracking-tighter text-white/50">FINVAULT</p>
                                </div>

                                <div>
                                    <p className="font-mono text-xl md:text-2xl lg:text-3xl text-white tracking-[0.2em] mb-4 lg:mb-8 shadow-sm scale-y-110 origin-left">
                                        {cardNum}
                                    </p>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Card Holder</p>
                                            <p className="text-xs lg:text-sm font-black uppercase tracking-tight text-white">{user?.name || 'Authorized Member'}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Expiry</p>
                                            <p className="text-xs lg:text-sm font-black text-white">09 / 28</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="vault-card p-6 lg:p-8 border-white/5 bg-zinc-950/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Protection Status</h3>
                                </div>
                                <p className="text-lg font-black text-white mb-2">Activated Level 4</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">Real-time fraud surveillance active for all transfers.</p>
                            </div>

                            <div className="vault-card p-6 lg:p-8 border-white/5 bg-zinc-900/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asset Velocity</h3>
                                </div>
                                <p className="text-lg font-black text-white mb-2">Platinum Limits</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">Transfer capacity up to $25,000 / 24HR cycle.</p>
                            </div>
                        </div>

                        <button className="w-full py-5 bg-white/4 hover:bg-white/8 rounded-2xl lg:rounded-[24px] border border-white/10 flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest group transition-all duration-300 transform active:scale-[0.98]">
                            Manage Protocol Access <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </button>
                    </div>

                    {/* Transfers Feed */}
                    <div className="xl:col-span-2 space-y-8 order-1 xl:order-2">
                        <div className="vault-card p-0 flex flex-col bg-zinc-950/40 border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                            <div className="px-6 lg:px-8 py-5 lg:py-6 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Send className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-base lg:text-lg font-black uppercase tracking-tighter">Recent Transfers</h3>
                                </div>
                                <button onClick={fetchBanking}><RefreshCw className={`w-3.5 h-3.5 text-zinc-600 hover:text-white transition ${loading ? 'animate-spin' : ''}`} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-6 max-h-[400px]">
                                {!loading && (transfers || []).length > 0 ? transfers.map(t => (
                                    <div key={t.id} className="flex justify-between items-center group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${t.direction === 'sent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                                                {t.direction === 'sent' ? <Layers className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] lg:text-sm font-black text-zinc-100 uppercase tracking-tight truncate max-w-[120px]">
                                                    {t.direction === 'sent' ? t.to_email : t.from_email}
                                                </p>
                                                <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest opacity-30 mt-0.5">
                                                    {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {t.direction}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-black tracking-tighter text-sm ${t.direction === 'sent' ? 'text-zinc-100' : 'text-emerald-400'}`}>
                                                {t.direction === 'sent' ? '-' : '+'}${Number(t.amount || 0).toFixed(2)}
                                            </p>
                                            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded-md">Settled</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-10 py-10">
                                        <History className="w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No transfer records found</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 lg:p-8 border-t border-white/5 bg-black/20 text-center space-y-4 shrink-0">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Balance Locked</p>
                                    <Lock className="w-3 h-3 text-zinc-600" />
                                </div>
                                <p className="text-3xl lg:text-4xl font-black text-white tracking-widest tabular-nums">
                                    <span className="text-sm lg:text-lg opacity-30 mr-1">$</span>
                                    {Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
