import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, TrendingUp } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(login({ email, password }));
        if (login.fulfilled.match(resultAction)) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Dynamic Aura Background */}
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[180px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

            <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-zinc-950/40 border border-white/5 rounded-[40px] shadow-3xl overflow-hidden backdrop-blur-2xl relative z-10">

                {/* Left Section - Hero Brand Area */}
                <div className="hidden lg:flex flex-col justify-center p-16 bg-gradient-to-br from-zinc-900/50 to-transparent border-r border-white/5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20">
                        <Lock className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="font-heading text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                        Secure your <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            financial future.
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg mb-12 leading-relaxed max-w-md">
                        FinVault is a state-of-the-art encrypted platform for modern wealth management, stocks, and real-time transaction monitoring.
                    </p>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-blue-500/50 transition">
                                <Shield className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-zinc-300 font-medium">Bank-grade direct encryption</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/50 transition">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                            </div>
                            <span className="text-zinc-300 font-medium">Real-time market insights</span>
                        </div>
                    </div>
                </div>

                {/* Right Section - Authentic Login Form */}
                <div className="flex flex-col justify-center p-8 md:p-16 lg:p-20 bg-black/20">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <Lock className="w-6 h-6 text-black" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">FinVault</h2>
                    </div>

                    <div className="mb-10 text-left">
                        <h2 className="font-heading text-4xl font-black text-white mb-2">Login</h2>
                        <p className="text-zinc-500 text-sm">Please authenticate to access your personal vault.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Identifier</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition placeholder-zinc-700"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center pr-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Security Key</label>
                                <button type="button" className="text-xs font-bold text-blue-500 hover:text-blue-400">Recover Key?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition placeholder-zinc-700 font-mono"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-white/5"
                        >
                            {isLoading ? 'Accessing Secure Core...' : 'Enter the Vault'}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-zinc-600 text-sm font-medium">
                        Authorized Personnel Only. <span className="text-zinc-400">Request access from IT.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
