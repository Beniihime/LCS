// import axiosInstance from '@/utils/axios.js';

self.onmessage = async (event) => {
    if (event.data.action === "start") {
        const { refreshToken, userId, refreshTokenExpired } = event.data;
        console.debug("[TokenWorker] Starting background token refresh...");
        startTokenRefreshLoop(refreshToken, userId, refreshTokenExpired);
    }
}

function startTokenRefreshLoop(refreshToken, userId, refreshTokenExpired) {
    setInterval(async () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiration = refreshTokenExpired - currentTime;

        console.debug(`[TokenWorker] Time until expiration: ${timeUntilExpiration} seconds`);

        if (timeUntilExpiration <= 60) {
            console.debug("[TokenWorker] Refreshing token...");
            await refreshAccessToken(refreshToken, userId);
        }
    }, 15 * 60 * 1000);
}

async function refreshAccessToken(refreshToken, userId) {
    try {

        if (!userId || !refreshToken) {
            console.error("[TokenWorker] Missing user credentials, stopping...");
            return;
        }

        const response = await fetch("/api/auth-refresh-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: refreshToken, userId }),
        }) 

        if (!response.ok) {
            throw new Error(`[TokenWorker] Failed to refresh token: ${response.status}`);
        }

        const data = await response.json();
        console.debug("[TokenWorker] Token refreshed successfully!");

        self.postMessage({ action: "updateToken", accessToken: data.accessToken, refreshToken: data.refreshTokenValue, refreshTokenExpired: data.refreshTokenExpired });

    } catch (error) {
        console.error("[TokenWorker] Error refreshing token:", error);
    }
}