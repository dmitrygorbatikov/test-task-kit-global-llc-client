import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-8 text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-sm text-gray-400 mb-6">Not Found</p>

                <p className="text-gray-600 mb-6">
                    The page you are looking for doesn’t exist or has been moved.
                </p>

                <Link
                    to="/projects"
                    className="inline-block w-full py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition font-semibold"
                >
                    Back to projects
                </Link>
            </div>
        </div>
    );
}