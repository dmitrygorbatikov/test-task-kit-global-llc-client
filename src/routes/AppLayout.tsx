import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/authStore';

export default function AppLayout() {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            logout();
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
                <div className="text-lg font-semibold text-slate-900">
                    Kit Global LLC
                </div>

                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition"
                >
                    Logout
                </button>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}