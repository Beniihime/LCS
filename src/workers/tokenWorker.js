// import axiosInstance from '@/utils/axios.js';

let currentRefreshToken = null;
let currentUserId = null;
let currentRefreshTokenExpired = null;
let currentAccessTokenExpired = null;
let refreshInterval = null;

self.onmessage = async (event) => {
    if (event.data.action === "start") {
        const { refreshToken, userId, refreshTokenExpired, accessTokenExpired } = event.data;
        console.debug("[TokenWorker] Starting background token refresh...");

        currentRefreshToken = refreshToken;
        currentUserId = userId;
        currentRefreshTokenExpired = refreshTokenExpired;
        currentAccessTokenExpired = accessTokenExpired;

        startTokenRefreshLoop();
    } else if (event.data.action === "updateToken") {
        console.debug("[TokenWorker] Updating internal state from main thread message");
        currentRefreshToken = event.data.refreshToken;
        currentUserId = event.data.userId;
        currentRefreshTokenExpired = event.data.refreshTokenExpired;
        currentAccessTokenExpired = event.data.accessTokenExpired;
    } else if (event.data.action === "refreshOnce") {
        const { refreshToken, userId } = event.data;
        await refreshAccessToken(refreshToken, userId);
    } else if (event.data.action === "stop") {
        stopTokenRefreshLoop();
    }
}

function startTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(async () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilRefreshExpires = currentRefreshTokenExpired  - currentTime;
        const timeUntilAccessExpires = currentAccessTokenExpired  - currentTime;

        console.debug(`[TokenWorker] Time until refreshToken expires: ${timeUntilRefreshExpires} seconds`);
        console.debug(`[TokenWorker] Time until accessToken expires: ${timeUntilAccessExpires} seconds`);

        if (timeUntilRefreshExpires <= 300) {
            console.debug("[TokenWorker] Refreshing token...");
            await refreshAccessToken(currentRefreshToken, currentUserId);
        }

        if (timeUntilAccessExpires <= 60) {
            console.debug("[TokenWorker] Refreshing token...");
            await refreshAccessToken(currentRefreshToken, currentUserId);
        }
    }, 10000);
}

function stopTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.debug("[TokenWorker] Token refresh loop stopped");
    }
}

async function refreshAccessToken(refreshToken, userId) {
    try {

        if (!userId || !refreshToken) {
            console.error("[TokenWorker] Missing user credentials, stopping...");
            return;
        }

        const url = `https://development.sibadi.org/api/auth/refresh-token`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                value: refreshToken,
                userId: userId
            })
        }) 

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error(`[TokenWorker] Refresh token invalid (${response.status}). Stopping refresh attempts.`);
                self.postMessage({ action: "refreshFailed" });
                return;
            }
            throw new Error(`[TokenWorker] Failed to refresh token: ${response.status}`);
        }

        const data = await response.json();
        let newAccessTokenExpired;
        if (data.accessTokenExpiresIn) {
            newAccessTokenExpired = Math.floor(Date.now() / 1000) + data.accessTokenExpiresIn;
        } else if (data.accessTokenExpired) {
            newAccessTokenExpired = data.accessTokenExpired;
        } else {
            newAccessTokenExpired = Math.floor(Date.now() / 1000) + 15 * 60;
        }

        console.debug("[TokenWorker] Token refreshed successfully!");

        currentRefreshToken = data.refreshTokenValue;
        currentRefreshTokenExpired = data.refreshTokenExpired;
        currentAccessTokenExpired = newAccessTokenExpired;

        self.postMessage({ 
            action: "updateToken", 
            accessToken: data.accessToken, 
            refreshToken: data.refreshTokenValue, 
            refreshTokenExpired: data.refreshTokenExpired,
            accessTokenExpired: newAccessTokenExpired,
            userId: currentUserId
        });

    } catch (error) {
        console.error("[TokenWorker] Error refreshing token:", error);
    }
}