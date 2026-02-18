import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
            <ShieldAlert size={64} className="text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
            <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                Back to Login
            </Link>
        </div>
    );
};

export default Unauthorized;
