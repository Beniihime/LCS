// import axiosInstance from '@/utils/axios.js';

let currentRefreshToken = null;
let currentUserId = null;
let currentRefreshTokenExpired = null;
let currentAccessTokenExpired = null;
let refreshInterval = null;
let isRefreshing = false;

self.onmessage = async (event) => {
    switch (event.data.action) {
        case "start":
            const { refreshToken, userId, refreshTokenExpired, accessTokenExpired } = event.data;
            console.debug("[TokenWorker] Starting background token refresh...");

            currentRefreshToken = refreshToken;
            currentUserId = userId;
            currentRefreshTokenExpired = refreshTokenExpired;
            currentAccessTokenExpired = accessTokenExpired;

            startTokenRefreshLoop();
            break;

        case "updateToken":
            console.debug("[TokenWorker] Updating internal state from main thread message");
            currentRefreshToken = event.data.refreshToken;
            currentUserId = event.data.userId;
            currentRefreshTokenExpired = event.data.refreshTokenExpired;
            currentAccessTokenExpired = event.data.accessTokenExpired;
            break;

        case "refreshOnce":
            const { refreshToken: onceRefreshToken, userId: onceUserId } = event.data;
            await refreshAccessToken(onceRefreshToken, onceUserId, true);
            break;

        case "stop":
            stopTokenRefreshLoop();
            break;

        default:
            console.warn("[TokenWorker] Unknown action:", event.data.action);
    }
}

function startTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(async () => {
        // Пропускаем если уже обновляем
        if (isRefreshing) {
            console.debug("[TokenWorker] Refresh already in progress, skipping...");
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilRefreshExpires = currentRefreshTokenExpired - currentTime;
        const timeUntilAccessExpires = currentAccessTokenExpired - currentTime;

        console.debug(`[TokenWorker] Time until refreshToken expires: ${timeUntilRefreshExpires} seconds`);
        console.debug(`[TokenWorker] Time until accessToken expires: ${timeUntilAccessExpires} seconds`);

        if (timeUntilRefreshExpires <= 60) {
            console.warn("[TokenWorker] Refresh token expiring soon, stopping background refresh");
            self.postMessage({ action: "refreshFailed" });
            stopTokenRefreshLoop();
            return;
        }

        if (timeUntilAccessExpires <= 300) { // 5 минут
            console.debug("[TokenWorker] Access token expiring soon, refreshing...");
            await refreshAccessToken(currentRefreshToken, currentUserId);
        }
    }, 30000);
}

function stopTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.debug("[TokenWorker] Token refresh loop stopped");
    }
}

async function refreshAccessToken(refreshToken, userId, isOnceRefresh = false) {
    if (isRefreshing && !isOnceRefresh) {
        console.debug("[TokenWorker] Refresh already in progress");
        return;
    }

    isRefreshing = true;

    try {
        if (!userId || !refreshToken) {
            console.error("[TokenWorker] Missing user credentials, stopping...");
            self.postMessage({ action: "refreshFailed" });
            return;
        }

        console.debug("[TokenWorker] Attempting to refresh token...");

        const response = await fetch("https://development.sibadi.org/api/auth/refresh-token", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                value: refreshToken,
                userId: userId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[TokenWorker] Refresh failed with status ${response.status}:`, errorText);

            if (response.status === 401 || response.status === 403) {
                console.error("[TokenWorker] Refresh token invalid, user needs to login again");
                self.postMessage({ action: "refreshFailed" });
                return;
            }

            throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.accessToken || !data.refreshTokenValue) {
            throw new Error("Invalid response: missing tokens");
        }

        let newAccessTokenExpired;
        if (data.accessTokenExpiresIn) {
            newAccessTokenExpired = Math.floor(Date.now() / 1000) + data.accessTokenExpiresIn;
        } else if (data.accessTokenExpired) {
            newAccessTokenExpired = data.accessTokenExpired;
        } else {
            newAccessTokenExpired = Math.floor(Date.now() / 1000) + (15 * 60);
        }

        console.debug("[TokenWorker] Token refreshed successfully!");

        if (!isOnceRefresh) {
            currentRefreshToken = data.refreshTokenValue;
            currentRefreshTokenExpired = data.refreshTokenExpired;
            currentAccessTokenExpired = newAccessTokenExpired;
        }

        self.postMessage({ 
            action: "updateToken", 
            accessToken: data.accessToken, 
            refreshToken: data.refreshTokenValue, 
            refreshTokenExpired: data.refreshTokenExpired,
            accessTokenExpired: newAccessTokenExpired,
            userId: userId
        });

    } catch (error) {
        console.error("[TokenWorker] Error refreshing token:", error);
        
        if (error.message.includes("401") || error.message.includes("403")) {
            self.postMessage({ action: "refreshFailed" });
        }
        
    } finally {
        isRefreshing = false;
    }
}