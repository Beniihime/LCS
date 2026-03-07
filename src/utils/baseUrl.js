import { getApiBaseUrlOverride } from "@/mocks/config";

export const getBaseUrl = () => {
    const override = getApiBaseUrlOverride();
    if (override) {
        return override.endsWith("/") ? override.slice(0, -1) : override;
    }

    const hostname = window.location.hostname;
    
    if (hostname === 'localhost') {
        return 'https://development.sibadi.org';
    }
    
    return window.location.origin;
};
