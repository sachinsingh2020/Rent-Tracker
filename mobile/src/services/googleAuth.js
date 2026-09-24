import { Platform } from 'react-native';

const GOOGLE_CLIENT_ID = '939198721457-npargv35nf98am3r7qcphtqj65cg46dm.apps.googleusercontent.com';

/**
 * Loads the official Google Identity Services script on Web
 */
const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'));
    if (window.google?.accounts?.oauth2) return resolve(window.google);

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.onload = () => resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google);
    };
    script.onerror = (err) => reject(new Error('Failed to load Google Sign-In SDK'));
    document.body.appendChild(script);
  });
};

/**
 * Trigger Real Google Sign-in Popup
 * Returns real Google profile: { googleId, email, name, avatar }
 */
export const promptRealGoogleSignIn = async () => {
  if (Platform.OS === 'web') {
    const google = await loadGoogleScript();

    return new Promise((resolve, reject) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error));
            }

            try {
              // Fetch real user details directly from Google's official userinfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });
              const userInfo = await res.json();

              if (!userInfo.email) {
                return reject(new Error('Could not retrieve email from Google'));
              }

              resolve({
                googleId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split('@')[0],
                avatar: userInfo.picture || '',
              });
            } catch (fetchErr) {
              reject(fetchErr);
            }
          },
        });

        // Opens the real Google Sign-In dialog!
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback for native devices before native build
  throw new Error('Google Sign-in on native mobile requires building with Google Services credentials.');
};
