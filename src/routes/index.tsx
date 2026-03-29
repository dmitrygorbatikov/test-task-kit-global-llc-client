import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import AppLayout from './AppLayout';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectItemPage from '../pages/ProjectItemPage';

export const router = createBrowserRouter([
    {
        element: <GuestRoute />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />, // 👈 вот тут layout
                children: [
                    { path: '/projects', element: <ProjectsPage /> },
                    { path: '/projects/:projectId', element: <ProjectItemPage /> },
                ],
            },
        ],
    },
]);