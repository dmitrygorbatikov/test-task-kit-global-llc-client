import { useState } from 'react';
import { useAuthStore } from '../../shared/stores/authStore';
import { useNavigate } from 'react-router-dom';
import * as React from "react";

export default function RegisterPage() {
    const navigate = useNavigate();
    const register = useAuthStore((s) => s.register);
    const loading = useAuthStore((s) => s.loading);
    const errorFromStore = useAuthStore((s) => s.error);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirm) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            setLocalError(null);
            await register({ firstName, lastName, email, password });
            navigate('/projects');
        } catch (err: any) {
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Register</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
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
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-gray-500 text-sm text-center mt-6">
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        className="text-gray-700 cursor-pointer hover:underline"
                    >
            Log in
          </span>
                </p>
            </div>
        </div>
    );
}