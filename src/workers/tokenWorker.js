// import axiosInstance from '@/utils/axios.js';

let currentRefreshToken = null;
let currentUserId = null;
let currentRefreshTokenExpired = null;
let currentAccessTokenExpired = null;

self.onmessage = async (event) => {
    if (event.data.action === "start") {
        const { refreshToken, userId, refreshTokenExpired, accessTokenExpired } = event.data;
        console.debug("[TokenWorker] Starting background token refresh...");

        currentRefreshToken = refreshToken;
        currentUserId = userId;
        currentRefreshTokenExpired = refreshTokenExpired;
        currentAccessTokenExpired = accessTokenExpired;

        startTokenRefreshLoop();
    }
    if (event.data.action === "refreshOnce") {
        const { refreshToken, userId } = event.data;
        await refreshAccessToken(refreshToken, userId);
    }
}

function startTokenRefreshLoop() {
    setInterval(async () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilRefreshExpires = currentRefreshTokenExpired  - currentTime;
        const timeUntilAccessExpires = currentAccessTokenExpired  - currentTime;

        console.debug(`[TokenWorker] Time until refreshToken expires: ${timeUntilRefreshExpires} seconds`);
        console.debug(`[TokenWorker] Time until accessToken expires: ${timeUntilAccessExpires} seconds`);

        if (timeUntilRefreshExpires <= 60) {
            console.debug("[TokenWorker] Refreshing token...");
            await refreshAccessToken(currentRefreshToken, currentUserId);
        }

        if (timeUntilAccessExpires <= 60) {
            console.debug("[TokenWorker] Refreshing token...");
            await refreshAccessToken(currentRefreshToken, currentUserId);
        }
    }, 10000);
}

async function refreshAccessToken(refreshToken, userId) {
    try {

        if (!userId || !refreshToken) {
            console.error("[TokenWorker] Missing user credentials, stopping...");
            return;
        }

        const url = `https://development.sibadi.org/api/auth/refresh-token?value=${encodeURIComponent(refreshToken)}&userId=${encodeURIComponent(userId)}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        }) 

        if (!response.ok) {
            throw new Error(`[TokenWorker] Failed to refresh token: ${response.status}`);
        }

        const data = await response.json();
        const newAccessTokenExpired = Math.floor(Date.now() / 1000) + 15 * 60;
        console.debug("[TokenWorker] Token refreshed successfully!");

        currentRefreshToken = data.refreshTokenValue;
        currentRefreshTokenExpired = data.refreshTokenExpired;
        currentAccessTokenExpired = newAccessTokenExpired;

        self.postMessage({ 
            action: "updateToken", 
            accessToken: data.accessToken, 
            refreshToken: data.refreshTokenValue, 
            refreshTokenExpired: data.refreshTokenExpired,
            accessTokenExpired: newAccessTokenExpired
        });

    } catch (error) {
        console.error("[TokenWorker] Error refreshing token:", error);
    }
}