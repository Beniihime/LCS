import axios from "axios";
import router from "../router";

const axiosInstance = axios.create({
    baseURL: 'https://development.sibadi.org',
    headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const userId = localStorage.getItem('userId');

                if (refreshToken && userId) {
                    const response = await axiosInstance.post('/api/auth/refresh-token', null, {
                        params: {
                            value: refreshToken,
                            userId: userId
                        }
                    });

                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshTokenValue);

                    originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                console.debug('Ошибка при обновлении токена: ', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                router.push('/auth');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;