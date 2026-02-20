import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api'
});

// Adaugă automat token-ul în header dacă acesta există în localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; //
    }
    return config;
});

export default api;