
let currentRefreshToken = null;
let currentUserId = null;
let currentRefreshTokenExpired = null;
let currentAccessTokenExpired = null;
let refreshInterval = null;
let isRefreshing = false;
let apiBase = null;

self.onmessage = async (event) => {
    switch (event.data.action) {
        case "start": {
            const {
                refreshToken,
                userId,
                refreshTokenExpired,
                accessTokenExpired,
                apiBase: passedApiBase,
            } = event.data;
            
            currentRefreshToken = refreshToken;
            currentUserId = userId;
            currentRefreshTokenExpired = refreshTokenExpired;
            currentAccessTokenExpired = accessTokenExpired;

            apiBase = passedApiBase;

            startTokenRefreshLoop();
            break;
        }

        case "updateToken": {
            const {
                refreshToken,
                userId,
                refreshTokenExpired,
                accessTokenExpired,
                apiBase: passedApiBase,
            } = event.data;

            currentRefreshToken = refreshToken;
            currentUserId = userId;
            currentRefreshTokenExpired = refreshTokenExpired;
            currentAccessTokenExpired = accessTokenExpired;

            if (passedApiBase) apiBase = passedApiBase;

            const now = Math.floor(Date.now() / 1000);
            
            const accessLeft = currentAccessTokenExpired 
                ? Math.round((currentAccessTokenExpired - now) / 60) 
                : "неизвестно";
                
            const refreshLeft = currentRefreshTokenExpired 
                ? Math.round((currentRefreshTokenExpired - now) / 60) 
                : "неизвестно";

            console.log(
                `[Token ${event.data.action === "start" ? "запущен" : "обновлён"}] ` +
                `Access ~${accessLeft} мин | Refresh ~${refreshLeft} мин`
            );

            if (event.data.action === "start") {
                startTokenRefreshLoop();
            }
            break;
        }

        case "refreshOnce": {
            const { refreshToken, userId } = event.data;
            await refreshAccessToken(refreshToken, userId, true);
            break;
        }

        case "stop":
            stopTokenRefreshLoop();
            break;

        default:
            console.warn("[TokenWorker] Unknown action:", action);
    }
}

function startTokenRefreshLoop() {
    stopTokenRefreshLoop();

    refreshInterval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);

        if (!currentRefreshToken || !currentUserId) return;

        let accessLeftSec = currentAccessTokenExpired 
            ? currentAccessTokenExpired - now 
            : -1;
        
        let accessLeftMin = Math.round(accessLeftSec / 60);

        let refreshLeftSec = currentRefreshTokenExpired 
            ? currentRefreshTokenExpired - now 
            : -1;
        
        let refreshLeftMin = Math.round(refreshLeftSec / 60);

        console.log(
            `[Token Status] ` +
            `Access: ${accessLeftMin >= 0 ? accessLeftMin + ' мин' : 'истёк'} ` +
            `(до ${formatTimeLeft(accessLeftSec)}), ` +
            `Refresh: ${refreshLeftMin >= 0 ? refreshLeftMin + ' мин' : 'истёк'} ` +
            `(до ${formatTimeLeft(refreshLeftSec)})`
        );

        if (currentRefreshTokenExpired && now >= currentRefreshTokenExpired) {
            console.warn("[TokenWorker] Refresh token expired");
            self.postMessage({ action: "refreshFailed", reason: "refresh_expired" });
            stopTokenRefreshLoop();
            return;
        }

        if (
            currentAccessTokenExpired &&
            now >= currentAccessTokenExpired - 180 &&
            !isRefreshing
        ) {
            console.log(
                `[Token] Запускаем обновление — осталось ${accessLeftMin} мин ` +
                `(${accessLeftSec} сек)`
            );
            refreshAccessToken(currentRefreshToken, currentUserId);
        }
    }, 60_000);
}

function formatTimeLeft(seconds) {
    if (seconds < 0) return "уже истёк";
    if (seconds < 60) return `${seconds} сек`;
    
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} мин ${sec > 0 ? sec + ' сек' : ''}`.trim();
}

function stopTokenRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

async function refreshAccessToken(refreshToken, userId, isOnce = false) {
    if (isRefreshing) {
        console.log("[DEBUG] Уже идёт обновление, пропускаем");
        return;
    }
    isRefreshing = true;

    try {
        const now = Math.floor(Date.now() / 1000);
        const leftBeforeRefresh = currentAccessTokenExpired 
            ? Math.round(currentAccessTokenExpired - now) 
            : "неизвестно";

        console.log(
            `[Refresh START] Осталось до истечения access: ` +
            `${typeof leftBeforeRefresh === 'number' ? leftBeforeRefresh + ' сек' : leftBeforeRefresh}`
        );

        console.log("[DEBUG] Запуск refreshAccessToken", {
            hasRefresh: !!refreshToken,
            refreshLength: refreshToken?.length,
            userId: userId,
            isOnce,
            apiBase
        });

        if (!refreshToken || !userId) {
            console.warn("[DEBUG] Отсутствуют refreshToken или userId");
            self.postMessage({ action: "refreshFailed", reason: "missing_credentials" });
            return;
        }

        const url = `${apiBase}/api/auth/refresh-token`;
        console.log("[DEBUG] Отправка запроса на:", url);

        const payload = {
            value: refreshToken,
            userId: userId
        };

        console.log("[DEBUG] Тело запроса:", JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("[DEBUG] Ответ получен, статус:", response.status);

        if (!response.ok) {
            let text;
            try {
                text = await response.text();
                console.log("[DEBUG] Текст ошибки от сервера:", text);
            } catch (e) {
                text = "Не удалось прочитать тело ответа";
                console.warn("[DEBUG] Не удалось прочитать текст ошибки");
            }

            self.postMessage({
                action: "refreshError",
                status: response.status,
                body: text,
            });

            throw new Error(`Refresh error ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log("[DEBUG] Успешный ответ:", data);

        const newAccessTokenExpired = now + Math.max(0, data.accessTokenExpiresIn || 900);

        self.postMessage({
            action: "updateToken",
            accessToken: data.accessToken,
            refreshToken: data.refreshTokenValue,
            refreshTokenExpired: data.refreshTokenExpired,
            accessTokenExpired: newAccessTokenExpired,
            userId,
        });
    } catch (err) {
        console.error("[TokenWorker] Критическая ошибка при refresh:", err);
        self.postMessage({
            action: "refreshError",
            reason: err?.message || "unknown_error",
            stack: err?.stack
        });
    } finally {
        isRefreshing = false;
        console.log("[DEBUG] Завершение попытки refresh, isRefreshing =", isRefreshing);
    }
}