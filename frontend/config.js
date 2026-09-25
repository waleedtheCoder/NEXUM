// Backend URL resolution:
//  - Builds (EAS): EXPO_PUBLIC_BACKEND_URL is set per profile in eas.json.
//  - Local dev with Expo Go: falls back to your machine's LAN IP (NOT localhost).
export default {
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.0.134:8000',
};
