import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../shared/lib/auth';

export const GuestRoute = () => {
    return !isAuthenticated() ? <Outlet /> : <Navigate to="/" replace />;
};