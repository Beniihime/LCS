import TokenWorker from "@/workers/tokenWorker.js?worker";

let tokenWorker = null;

export function startTokenWorker() {
    if (typeof window === "undefined" || !window.Worker) {
        console.error("[TokenService] Web Workers not supported or window is undefined.");
        return;
    }

    if (tokenWorker) {
        console.debug("[TokenService] Token worker is already running.");
        return;
    }

    tokenWorker = new TokenWorker();

    const refreshToken = localStorage.getItem("refreshToken");
    const userId = localStorage.getItem("userId");
    const refreshTokenExpired = parseInt(localStorage.getItem("refreshTokenExpired"), 10);
    const accessTokenExpired = parseInt(localStorage.getItem("accessTokenExpired"), 10);

    if (!refreshToken || !userId || isNaN(refreshTokenExpired) || isNaN(accessTokenExpired)) {
        console.error("[TokenService] Missing required authentication data.");
        return;
    }

    tokenWorker.postMessage({ action: "start", refreshToken, userId, refreshTokenExpired, accessTokenExpired });

    tokenWorker.onmessage = (event) => {
        if (event.data.action === "updateToken") {
            console.debug("[TokenService] New token from Worker:", event.data);

            localStorage.setItem("accessToken", event.data.accessToken);
            localStorage.setItem("refreshToken", event.data.refreshToken);
            localStorage.setItem("refreshTokenExpired", event.data.refreshTokenExpired);
            localStorage.setItem("accessTokenExpired", event.data.accessTokenExpired);
        }
    };

    tokenWorker.onerror = (error) => {
        console.error("[TokenService] Worker encountered an error:", error);
    };

    console.debug("[TokenService] Background token worker started!");
}

export function refreshTokenThroughWorker() {
    const refreshToken = localStorage.getItem("refreshToken");
    const userId = localStorage.getItem("userId");

    if (!refreshToken || !userId) {
        return Promise.reject("Missing credentials for worker refresh");
    }

    return new Promise((resolve, reject) => {
        const worker = new TokenWorker();

        const timeout = setTimeout(() => {
            reject("Worker response timeout");
            worker.terminate();
        }, 5000);

        worker.onmessage = (event) => {
            if (event.data.action === "updateToken") {
                clearTimeout(timeout);
                resolve(event.data);
                worker.terminate();
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
            worker.terminate();
        };

        worker.postMessage({ action: "refreshOnce", refreshToken, userId });
    });
}