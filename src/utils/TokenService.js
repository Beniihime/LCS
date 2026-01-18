import TokenWorker from "@/workers/tokenWorker?worker";
import { getBaseUrl } from './baseUrl';

let tokenWorker = null;
let refreshPromise = null;

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const ACCESS_EXPIRED_KEY = "accessTokenExpired";
const REFRESH_EXPIRED_KEY = "refreshTokenExpired";

let isSessionExpired = false;

export function markSessionExpired() {
    isSessionExpired = true;
}

export function isSessionExpiredFlag() {
    return isSessionExpired;
}

export function resetSessionFlags() {
    isSessionExpired = false;
}

function nowSec() {
    return Math.floor(Date.now() / 1000);
}

export function saveAuthData({
    accessToken,
    refreshToken,
    userId,
    accessTokenExpired,
    refreshTokenExpired,
}) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(ACCESS_EXPIRED_KEY, String(accessTokenExpired));
    localStorage.setItem(REFRESH_EXPIRED_KEY, String(refreshTokenExpired));

    tokenWorker?.postMessage({
        action: "updateToken",
        accessToken,
        refreshToken,
        userId,
        accessTokenExpired,
        refreshTokenExpired,
        apiBase: getBaseUrl(),
    });
}

export function clearAuthData() {
    localStorage.clear();
    stopTokenWorker();
    markSessionExpired();
    window.location.href = "/auth";
}

export function startTokenWorker() {
    if (tokenWorker) return;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);

    if (!refreshToken || !userId) return;

    tokenWorker = new TokenWorker();

    tokenWorker.postMessage({
        action: "start",
        refreshToken,
        userId,
        refreshTokenExpired: Number(
            localStorage.getItem(REFRESH_EXPIRED_KEY)
        ),
        accessTokenExpired: Number(
            localStorage.getItem(ACCESS_EXPIRED_KEY)
        ),
        apiBase: getBaseUrl(),
    });

    tokenWorker.onmessage = (event) => {
        const { action } = event.data;

        if (action === "updateToken") {
            saveAuthData(event.data);

            if (refreshPromise) {
                refreshPromise.resolve(event.data.accessToken);
                refreshPromise = null;
            }
        }

        if (action === "refreshFailed") {
            console.error("[TokenService] refreshFailed:", event.data);

            if (
                event.data.reason === "invalid_refresh" ||
                event.data.reason === "refresh_expired"
            ) {
                clearAuthData();
            }

            refreshPromise?.reject(new Error("Refresh failed"));
            refreshPromise = null;
        }

        if (action === "refreshError") {
            console.warn("[TokenService] refreshError:", event.data);
            refreshPromise?.reject(
                new Error(event.data.reason || "Refresh error")
            );
            refreshPromise = null;
        }
    };

    tokenWorker.onerror = (err) => {
        console.error("[TokenService] Worker crashed:", err);
        clearAuthData();
    };
}

export function stopTokenWorker() {
    if (!tokenWorker) return;
    tokenWorker.postMessage({ action: "stop" });
    tokenWorker.terminate();
    tokenWorker = null;
}

export function getAccessToken() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expired = Number(localStorage.getItem(ACCESS_EXPIRED_KEY));

    if (!token || !expired) return null;
    if (nowSec() >= expired - 60) return null;

    return token;
}

export function refreshTokenThroughWorker() {
    if (refreshPromise) return refreshPromise.promise;

    refreshPromise = {};
    refreshPromise.promise = new Promise((resolve, reject) => {
        refreshPromise.resolve = resolve;
        refreshPromise.reject = reject;
    });

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);

    if (!refreshToken || !userId) {
        refreshPromise.reject(new Error("No refresh token"));
        refreshPromise = null;
        return Promise.reject();
    }

    const tempWorker = new TokenWorker();

    const timeout = setTimeout(() => {
        tempWorker.terminate();
        refreshPromise?.reject(new Error("Refresh timeout"));
        refreshPromise = null;
    }, 15_000);

    tempWorker.onmessage = (event) => {
        clearTimeout(timeout);

        if (event.data.action === "updateToken") {
            saveAuthData(event.data);
            refreshPromise.resolve(event.data.accessToken);
        } else {
            refreshPromise.reject(new Error("Refresh failed"));
        }

        refreshPromise = null;
        tempWorker.terminate();
    };

    tempWorker.onerror = () => {
        clearTimeout(timeout);
        refreshPromise?.reject(new Error("Worker error"));
        refreshPromise = null;
        tempWorker.terminate();
    };

    tempWorker.postMessage({
        action: "refreshOnce",
        refreshToken,
        userId,
        apiBase: getBaseUrl(),
    });

    return refreshPromise.promise;
}