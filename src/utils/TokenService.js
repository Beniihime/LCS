import TokenWorker from "@/workers/tokenWorker.js?worker";

let tokenWorker = null;
let refreshPromise = null;

export function startTokenWorker() {
    if (typeof window === "undefined" || !window.Worker) {
        console.error("[TokenService] Web Workers not supported or window is undefined.");
        return;
    }

    if (tokenWorker) {
        console.debug("[TokenService] Token worker is already running.");
        return;
    }

    const refreshToken = localStorage.getItem("refreshToken");
    const userId = localStorage.getItem("userId");
    const refreshTokenExpired = parseInt(localStorage.getItem("refreshTokenExpired"), 10);
    const accessTokenExpired = parseInt(localStorage.getItem("accessTokenExpired"), 10);

    if (!refreshToken || !userId || isNaN(refreshTokenExpired) || isNaN(accessTokenExpired)) {
        console.error("[TokenService] Missing required authentication data.");
        return;
    }

    tokenWorker = new TokenWorker();
    tokenWorker.postMessage({ 
        action: "start", 
        refreshToken, 
        userId, 
        refreshTokenExpired, 
        accessTokenExpired 
    });

    tokenWorker.onmessage = (event) => {
        if (event.data.action === "updateToken") {
            console.debug("[TokenService] New token from Worker:", event.data);

            const { accessToken, refreshToken: newRefreshToken, refreshTokenExpired: newRefreshExpired, accessTokenExpired: newAccessExpired } = event.data;
            
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);
            localStorage.setItem("refreshTokenExpired", newRefreshExpired);
            localStorage.setItem("accessTokenExpired", newAccessExpired);

            if (tokenWorker) {
                tokenWorker.postMessage({
                    action: "updateToken",
                    refreshToken: newRefreshToken,
                    userId: event.data.userId,
                    refreshTokenExpired: newRefreshExpired,
                    accessTokenExpired: newAccessExpired
                });
            }

            if (refreshPromise) {
                refreshPromise.resolve(event.data);
                refreshPromise = null;
            }
        } else if (event.data.action === "refreshFailed") {
            console.error("[TokenService] Worker reported refresh failure. Logging out.");
            clearAuthData();
            
            if (refreshPromise) {
                refreshPromise.reject(new Error("Token refresh failed"));
                refreshPromise = null;
            }
        }
    };

    tokenWorker.onerror = (error) => {
        console.error("[TokenService] Worker encountered an error:", error);
        stopTokenWorker();
        
        if (refreshPromise) {
            refreshPromise.reject(error);
            refreshPromise = null;
        }
    };

    console.debug("[TokenService] Background token worker started!");
}

export function stopTokenWorker() {
    if (tokenWorker) {
        console.debug("[TokenService] Stopping background token worker.");
        tokenWorker.postMessage({ action: "stop" });
        tokenWorker.terminate();
        tokenWorker = null;
    }
    
    if (refreshPromise) {
        refreshPromise.reject(new Error("Token worker stopped"));
        refreshPromise = null;
    }
}

function clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('refreshTokenExpired');
    localStorage.removeItem('accessTokenExpired');
    stopTokenWorker();
    window.location.href = '/auth';
}

export function refreshTokenThroughWorker() {
    if (refreshPromise) {
        return refreshPromise.promise;
    }

    const refreshToken = localStorage.getItem("refreshToken");
    const userId = localStorage.getItem("userId");

    if (!refreshToken || !userId) {
        return Promise.reject(new Error("Missing credentials for worker refresh"));
    }

    // Проверяем, истек ли refresh token
    const refreshTokenExpired = parseInt(localStorage.getItem("refreshTokenExpired"), 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (!isNaN(refreshTokenExpired) && currentTime >= refreshTokenExpired) {
        console.error("[TokenService] Refresh token has expired");
        clearAuthData();
        return Promise.reject(new Error("Refresh token expired"));
    }

    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    refreshPromise = { promise, resolve, reject };

    if (tokenWorker) {
        tokenWorker.postMessage({ action: "refreshOnce", refreshToken, userId });
    } else {
        const tempWorker = new TokenWorker();
        
        const timeout = setTimeout(() => {
            reject(new Error("Worker response timeout"));
            tempWorker.terminate();
            refreshPromise = null;
        }, 15000);

        tempWorker.onmessage = (event) => {
            clearTimeout(timeout);
            
            if (event.data.action === "updateToken") {
                resolve(event.data);
            } else if (event.data.action === "refreshFailed") {
                reject(new Error("Token refresh failed"));
            }
            
            tempWorker.terminate();
            refreshPromise = null;
        };

        tempWorker.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
            tempWorker.terminate();
            refreshPromise = null;
        };

        tempWorker.postMessage({ action: "refreshOnce", refreshToken, userId });
    }

    return promise;
}

export function isAccessTokenExpiringSoon(thresholdSeconds = 300) {
    const accessTokenExpired = parseInt(localStorage.getItem("accessTokenExpired"), 10);
    
    if (isNaN(accessTokenExpired)) {
        return true; // Считаем что истекает если нет информации
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return (accessTokenExpired - currentTime) <= thresholdSeconds;
}

export function isRefreshTokenValid() {
    const refreshTokenExpired = parseInt(localStorage.getItem("refreshTokenExpired"), 10);
    
    if (isNaN(refreshTokenExpired)) {
        return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime < refreshTokenExpired;
}