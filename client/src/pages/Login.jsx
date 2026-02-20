import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Mail, Lock, Loader2, LogIn, Shield, BarChart3, Package } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'CUSTOMER') {
                navigate('/shop');
            } else if (user.role === 'SUPPLIER') {
                navigate('/purchase-orders');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen h-screen flex text-slate-800 font-sans bg-slate-50/80 antialiased overflow-hidden">
            {/* Left panel - Brand & value proposition */}
            <div className="hidden lg:flex lg:w-[48%] bg-slate-900 items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/80 via-slate-900 to-slate-900" />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-600/20 to-transparent" />

                <div className="relative z-10 text-white px-14 py-16 max-w-lg animate-fade-in">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/10">
                            <Package className="w-6 h-6 text-blue-400" strokeWidth={1.75} />
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-white/95">Inventory System</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-5">
                        Sign in to your account
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed mb-12">
                        Streamline operations, track stock in real time, and keep your business running smoothly from one secure dashboard.
                    </p>
                    <ul className="space-y-4">
                        {[
                            { icon: BarChart3, text: 'Real-time analytics and reporting' },
                            { icon: Shield, text: 'Secure, role-based access' },
                        ].map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-slate-300 text-sm">
                                <Icon className="w-5 h-5 text-blue-400 shrink-0" strokeWidth={1.75} />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right panel - Form */}
            <div className="w-full lg:w-[52%] flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-[420px] animate-scale-in">
                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08),0_8px_16px_-4px_rgba(15,23,42,0.04)] border border-slate-200/80 p-8 sm:p-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-700 mb-4 ring-1 ring-slate-200/50">
                                <LogIn className="w-6 h-6" strokeWidth={1.75} />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome back</h2>
                            <p className="mt-1.5 text-sm text-slate-500">Enter your credentials to continue</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={1.75} />
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white text-[15px]"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={1.75} />
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white text-[15px]"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="remember-me"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                    <span className="text-slate-600 group-hover:text-slate-700">Remember me</span>
                                </label>
                                <a
                                    href="#"
                                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                                    <span className="flex-1 font-medium">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 font-medium text-[15px] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] shadow-lg shadow-slate-900/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign in
                                        <LogIn className="w-4 h-4 opacity-80" strokeWidth={2} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Create account
                            </Link>
                        </p>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        By signing in, you agree to our terms of service and privacy policy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
