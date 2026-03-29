import axios from 'axios';
import {useAuthStore} from "../stores/authStore.ts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const auth = useAuthStore.getState();
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register')
        ) {
            originalRequest._retry = true;

            auth.logout();

            window.location.href = '/login';
        }

        return Promise.reject(error);
    },
);