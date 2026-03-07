import axiosInstance from '@/utils/axios.js';
import { getSessionUserId, setSessionUserId } from '@/utils/TokenService';

let cachedUserId = null;
let cachedMe = null;
let inflightPromise = null;

export async function getCurrentUser(force = false) {
    const currentUserId = getSessionUserId();

    if (!force) {
        if (inflightPromise) return inflightPromise;
        if (cachedMe && cachedUserId === currentUserId) return cachedMe;
    }

    inflightPromise = (async () => {
        try {
            const response = await axiosInstance.get('/api/users/me/info');
            const responseUserId = response.data?.id || null;
            setSessionUserId(responseUserId);
            cachedUserId = responseUserId;
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
