import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

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
        <div className="min-h-screen relative flex items-center justify-center bg-gray-900 overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-40"></div>

            <div className="glass p-10 rounded-2xl shadow-2xl w-full max-w-lg z-10 border border-white/10 relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full mb-4 shadow-lg">
                        <Wallet className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-white text-center">Welcome to FinVault</h2>
                    <p className="text-gray-300 mt-2 text-sm text-center">Your all-in-one personal finance & investment dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm text-center">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            placeholder="admin@finvault.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mt-4"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
