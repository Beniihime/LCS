import axios from 'axios';

export const refreshToken = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (!userId || !refreshTokenValue) {
      throw new Error('User ID or refresh token not found.');
    }

    const response = await axios.post(`/api/auth/refresh-token`, null, {
      params: {
        value: refreshTokenValue,
        userId: userId
      },
      headers: {
        'accept': 'application/json'
      }
    });

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshTokenValue);
    localStorage.setItem('userId', response.data.userId);

    // Plan next token refresh
    scheduleTokenRefresh(response.data.refreshTokenExpired);
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
};

export const scheduleTokenRefresh = (refreshTokenExpired) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const delay = (refreshTokenExpired - currentTime) * 1000;

  if (delay > 0) {
    setTimeout(refreshToken, delay);
  } else {
    console.error('Invalid token expiration time.');
  }
};
