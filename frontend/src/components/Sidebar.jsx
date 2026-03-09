import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../features/authSlice';
import {
    Wallet, LayoutDashboard, History, BarChart2,
    CreditCard, LogOut, Menu, X, Bell
} from 'lucide-react';

const NAV = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'Activity', path: '/activity' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: CreditCard, label: 'Cards', path: '/cards' },
];

export default function Sidebar() {
    const { user } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => { dispatch(logout()); navigate('/'); };

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-heading text-base font-black text-white">FinVault</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-zinc-500"><Bell className="w-5 h-5" /></button>
                    <button onClick={() => setIsOpen(true)} className="text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <aside className="absolute top-0 right-0 bottom-0 w-[280px] bg-zinc-950 border-l border-white/5 p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-12">
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Navigation</span>
                            <button onClick={() => setIsOpen(false)} className="text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {NAV.map(({ icon: Icon, label, path }) => {
                                const active = pathname === path;
                                return (
                                    <button
                                        key={path}
                                        onClick={() => { navigate(path); setIsOpen(false); }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {label}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-auto space-y-4">
                            <div className="p-5 rounded-2xl bg-white/3 border border-white/5">
                                <p className="text-xs font-black text-white truncate">{user?.name || user?.email}</p>
                                <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                            </div>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 text-red-500 bg-red-500/10 px-5 py-4 rounded-2xl font-bold text-sm">
                                <LogOut className="w-5 h-5" /> Sign Out
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-black/50 border-r border-white/5 p-8 backdrop-blur-3xl z-30 sticky top-0 h-screen">
                <div className="flex items-center gap-4 mb-14">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-heading text-xl font-black tracking-tight text-white">FinVault</span>
                </div>

                <nav className="flex-1 space-y-1.5">
                    {NAV.map(({ icon: Icon, label, path }) => {
                        const active = pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${active
                                        ? 'bg-indigo-600/10 text-white border border-indigo-500/20'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-zinc-300'}`} />
                                {label}
                                {active && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5 space-y-3">
                    <div className="px-5 py-4 rounded-2xl bg-white/3 border border-white/5">
                        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">Authenticated</p>
                        <p className="text-xs font-black text-white truncate">{user?.name || 'Authorized Member'}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 text-red-500 bg-red-500/5 px-5 py-4 rounded-2xl hover:bg-red-500/10 transition font-black text-sm border border-red-500/10"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
