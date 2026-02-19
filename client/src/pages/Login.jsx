import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen flex text-gray-800 font-sans bg-gray-50">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex w-1/2 bg-indigo-600 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 z-10"></div>
                <div className="relative z-20 text-white p-12 text-center animate-fade-in">
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Inventory<br />Management</h1>
                    <p className="text-lg text-indigo-100 max-w-md mx-auto mb-8">Streamline your operations, track stock effortlessly, and grow your business with our powerful platform.</p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute top-12 right-12 w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl animate-pulse"></div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl animate-scale-in border border-gray-100">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                            <ArrowRight size={24} className="-rotate-45" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="mt-2 text-sm text-gray-500">Sign in to access your dashboard</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-pulse border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Sign in <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
