import { useState } from 'react';
import { useAuthStore } from '../../shared/stores/authStore';
import { useNavigate } from 'react-router-dom';
import * as React from 'react';

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const loading = useAuthStore((s) => s.loading);
    const errorFromStore = useAuthStore((s) => s.error);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        try {
            await login(email, password);
            navigate('/projects');
        } catch (err: any) {
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Login</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {(localError || errorFromStore) && (
                        <div className="text-red-500 text-sm text-center">
                            {localError || errorFromStore}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gray-300 hover:bg-gray-400 transition font-semibold text-gray-900 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-gray-500 text-sm text-center mt-6">
                    Don't have an account?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        className="text-gray-700 cursor-pointer hover:underline"
                    >
            Register
          </span>
                </p>
            </div>
        </div>
    );
}