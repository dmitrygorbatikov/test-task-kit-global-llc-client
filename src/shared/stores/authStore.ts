import { create } from 'zustand';
import { api } from '../api/axios';

interface AuthState {
    accessToken: string | null;
    isAuth: boolean;
    loading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem('accessToken'),
    isAuth: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data.accessToken;
            localStorage.setItem('accessToken', token);
            set({ accessToken: token, isAuth: true });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Login error';
            set({ error: message });
            throw new Error(message);
        } finally {
            set({ loading: false });
        }
    },

    register: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/register', data);
            const token = res.data.accessToken;
            localStorage.setItem('accessToken', token);
            set({ accessToken: token, isAuth: true });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registration error';
            set({ error: message });
            throw new Error(message);
        } finally {
            set({ loading: false });
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Logout error';
            set({ error: message });
            throw new Error(message);
        } finally {
            localStorage.removeItem('accessToken');
            set({ accessToken: null, isAuth: false });
            window.location.href = '/login';
        }
    },
}));