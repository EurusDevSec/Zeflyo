import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

export const getEchoInstance = (token: string, apiBaseUrl: string) => {
  // Extract hostname from apiBaseUrl, but always use Soketi port 6001
  let host = 'localhost';
  let scheme = 'http';

  try {
    const url = new URL(apiBaseUrl);
    host = url.hostname;
    scheme = url.protocol.replace(':', '');
  } catch (e) {
    console.error('Failed to parse apiBaseUrl for Echo host', e);
  }

  const isHttps = scheme === 'https';
  // Soketi always runs on port 6001 for local development, but when accessing via ngrok,
  // we must route through Nginx proxy on standard ports (80/443).
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const wsPort = isLocal ? 6001 : 80;
  const wssPort = isLocal ? 6001 : 443;

  return new Echo({
    broadcaster: 'pusher',
    key: 'zeflyo_key',
    cluster: 'mt1',
    wsHost: host,
    wsPort: wsPort,
    wssPort: wssPort,
    forceTLS: isHttps,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    // Laravel Broadcast Auth Endpoint
    authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};
