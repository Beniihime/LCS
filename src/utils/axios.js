import axios from "axios";
import router from "../router";
import { refreshTokenThroughWorker, isAccessTokenExpiringSoon } from "@/utils/TokenService";

const protocol = window.location.protocol;
const host = 'development.sibadi.org';

const axiosInstance = axios.create({
    baseURL: `${protocol}//${host}`,
    headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    async config => {
        let token = localStorage.getItem('accessToken');
        
        if (token && isAccessTokenExpiringSoon(60)) {
            try {
                console.debug("[Axios] Access token expiring soon, refreshing proactively...");
                const tokens = await refreshTokenThroughWorker();
                token = tokens.accessToken;
            } catch (error) {
                console.warn("[Axios] Proactive token refresh failed:", error);
            }
        }
        
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
                console.debug("[Axios] Received 401, attempting token refresh...");
                const tokens = await refreshTokenThroughWorker();

                if (tokens?.accessToken) {
                    onRefreshed(tokens.accessToken);

                    originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error("No access token received");
                }
            } catch (refreshError) {
                console.error("[Axios] Token refresh failed:", refreshError);
                
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("refreshTokenExpired");
                localStorage.removeItem("accessTokenExpired");
                localStorage.removeItem("userId");
                
                refreshSubscribers.forEach(callback => callback(null));
                refreshSubscribers = [];
                
                router.push("/auth");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;