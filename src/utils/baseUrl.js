export const getBaseUrl = () => {
    const hostname = window.location.hostname;
    
    if (hostname === '192.168.0.12' || hostname === 'localhost' || hostname === '192.168.0.35') {
        return 'https://development.sibadi.org';
    }
    
    return window.location.origin;
};
