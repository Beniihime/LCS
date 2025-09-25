import axios from "axios";
import router from "../router";
import { refreshTokenThroughWorker } from "@/utils/TokenService";

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

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}

function onRefreshed(newToken) {
    refreshSubscribers.forEach(callback => callback(newToken));
    refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise(resolve => {
                    subscribeTokenRefresh(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const tokens = await refreshTokenThroughWorker();

                if (tokens?.accessToken) {
                    localStorage.setItem("accessToken", tokens.accessToken);
                    localStorage.setItem("refreshToken", tokens.refreshToken);
                    localStorage.setItem("refreshTokenExpired", tokens.refreshTokenExpired);
                    localStorage.setItem("accessTokenExpired", tokens.accessTokenExpired);

                    onRefreshed(tokens.accessToken);

                    originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error("No access token received");
                }
            } catch (e) {
                console.debug("[Interceptor] Token refresh failed:", e);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("refreshTokenExpired");
                localStorage.removeItem("accessTokenExpired");
                localStorage.removeItem("userId");
                router.push("/auth");
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;