import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';

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
        <div className="min-h-screen bg-[#050505] flex relative overflow-hidden font-sans">

            {/* Dynamic Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] animate-float"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] animate-float" style={{ animationDelay: '3s' }}></div>

            {/* Left Area - Marketing/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 relative z-10 border-r border-white/5 bg-gradient-to-b from-transparent to-black/40">
                <div className="glass-card p-10 max-w-lg shadow-2xl animate-float" style={{ animationDuration: '8s' }}>
                    <div className="bg-white/10 w-fit p-4 rounded-xl mb-8 border border-white/10 shadow-inner">
                        <Wallet className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="font-heading text-5xl font-bold text-white mb-6 leading-tight">
                        Master your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            wealth journey.
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        FinVault brings enterprise-grade portfolio management, real-time tracking, and predictive insights to your pocket.
                    </p>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <ShieldCheck className="w-5 h-5 text-green-400" /> Bank-grade encryption & security
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <TrendingUp className="w-5 h-5 text-indigo-400" /> Real-time Alpha Vantage integration
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Area - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-md">

                    <div className="text-center mb-10 lg:hidden">
                        <div className="inline-block bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg mb-4">
                            <Wallet className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="font-heading text-3xl font-bold text-white">FinVault</h2>
                    </div>

                    <div className="glass-card p-8 md:p-10 w-full shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <h2 className="font-heading text-3xl font-bold text-white mb-2">Welcome back</h2>
                        <p className="text-gray-400 text-sm mb-8">Please enter your credentials to access your vault.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                                    <div className="text-red-400 text-sm">{error}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full input-glass rounded-xl p-4 text-sm font-medium placeholder-gray-600"
                                    placeholder="admin@finvault.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Password</label>
                                    <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition">Forgot password?</a>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full input-glass rounded-xl p-4 text-sm font-medium placeholder-gray-600"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full group glow-btn bg-white hover:bg-gray-100 text-[#050505] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all outline-none"
                            >
                                {isLoading ? 'Authenticating...' : 'Sign In'}
                                {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <p className="text-sm text-gray-500">
                                Don't have an account? <a href="#" className="text-white font-medium hover:text-blue-400 transition">Contact Administrator</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
