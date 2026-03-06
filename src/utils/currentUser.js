import axiosInstance from '@/utils/axios.js';

let cachedUserId = null;
let cachedMe = null;
let inflightPromise = null;

export async function getCurrentUser(force = false) {
    const currentUserId = localStorage.getItem('userId') || null;

    if (!force) {
        if (inflightPromise) return inflightPromise;
        if (cachedMe && cachedUserId === currentUserId) return cachedMe;
    }

    inflightPromise = (async () => {
        try {
            const response = await axiosInstance.get('/api/users/me/info');
            cachedUserId = currentUserId;
            cachedMe = response.data;
            return cachedMe;
        } finally {
            inflightPromise = null;
        }
    })();

    return inflightPromise;
}

export function resetCurrentUserCache() {
    cachedUserId = null;
    cachedMe = null;
    inflightPromise = null;
}
