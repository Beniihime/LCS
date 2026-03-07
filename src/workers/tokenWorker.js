let currentUserId = null;
let currentRefreshToken = null;
let currentAccessTokenExpired = null;
let refreshInterval = null;
let isRefreshing = false;
let apiBase = null;

self.onmessage = async (event) => {
    switch (event.data.action) {
        case "start": {
            const {
                userId,
                refreshToken,
                accessTokenExpired,
                apiBase: passedApiBase,
            } = event.data;

            currentUserId = userId ?? currentUserId;
            currentRefreshToken = refreshToken ?? currentRefreshToken;
            currentAccessTokenExpired = accessTokenExpired;
            apiBase = passedApiBase;

            startTokenRefreshLoop();
            break;
        }

        case "updateToken": {
            const {
                userId,
                refreshToken,
                accessTokenExpired,
                apiBase: passedApiBase,
            } = event.data;

            currentUserId = userId ?? currentUserId;
            currentRefreshToken = refreshToken ?? currentRefreshToken;
            currentAccessTokenExpired = accessTokenExpired;

            if (passedApiBase) apiBase = passedApiBase;
            break;
        }

        case "refreshOnce": {
            if (event.data.apiBase) apiBase = event.data.apiBase;
            await refreshAccessToken(
                event.data.refreshToken ?? currentRefreshToken,
                event.data.userId ?? currentUserId,
                true
            );
            break;
        }

        case "stop":
            stopTokenRefreshLoop();
            break;

        default:
            console.warn("[TokenWorker] Unknown action:", event.data.action);
    }
};

function nowSec() {
    return Math.floor(Date.now() / 1000);
}

function resolveAccessTokenExpired(data = {}) {
    const absoluteExp = Number(data.accessTokenExpired);
    if (Number.isFinite(absoluteExp) && absoluteExp > 0) {
        return absoluteExp;
    }

    const expiresIn = Number(data.accessTokenExpiresIn);
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
        return nowSec() + expiresIn;
    }

    return nowSec() + 15 * 60;
}

function startTokenRefreshLoop() {
    stopTokenRefreshLoop();

    refreshInterval = setInterval(() => {
        if (!currentAccessTokenExpired || isRefreshing) return;

        const now = nowSec();
        if (now >= currentAccessTokenExpired - 180) {
            refreshAccessToken(currentRefreshToken, currentUserId, false);
        }
    }, 60_000);
}

function stopTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

async function refreshAccessToken(refreshToken, userId, isOnce = false) {
    if (isRefreshing) return;
    if (!apiBase) {
        self.postMessage({ action: "refreshError", reason: "missing_api_base" });
        return;
    }
    if (!refreshToken || !userId) {
        self.postMessage({ action: "refreshFailed", reason: "missing_credentials" });
        if (!isOnce) stopTokenRefreshLoop();
        return;
    }

    isRefreshing = true;

    try {
        const response = await fetch(`${apiBase}/api/auth/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                value: refreshToken,
                userId,
            }),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => "");

            if (response.status === 401 || response.status === 403) {
                self.postMessage({ action: "refreshFailed", reason: "invalid_refresh", status: response.status, body });
                if (!isOnce) stopTokenRefreshLoop();
                return;
            }

            self.postMessage({
                action: "refreshError",
                reason: `http_${response.status}`,
                status: response.status,
                body,
            });
            return;
        }

        const data = await response.json();

        self.postMessage({
            action: "updateToken",
            accessToken: data.accessToken,
            refreshToken: data.refreshTokenValue ?? refreshToken,
            refreshTokenExpired: data.refreshTokenExpired,
            accessTokenExpired: resolveAccessTokenExpired(data),
            userId: data.userId ?? currentUserId,
        });
    } catch (err) {
        self.postMessage({
            action: "refreshError",
            reason: err?.message || "unknown_error",
        });
    } finally {
        isRefreshing = false;
    }
}
