export const isAuthenticated = () => {
    const accessToken = localStorage.getItem('accessToken');
    const accessTokenExpired = parseInt(localStorage.getItem('accessTokenExpired'), 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return !!accessToken && accessTokenExpired && accessTokenExpired > currentTime;
  };