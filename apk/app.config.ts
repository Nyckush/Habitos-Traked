import appJson from './app.json';

const config = appJson.expo;
const configExtra =
  typeof config === 'object' && config && 'extra' in config && typeof config.extra === 'object'
    ? config.extra
    : {};

export default {
  ...config,
  plugins: [...(config.plugins ?? []), 'expo-sqlite'],
  extra: {
    ...configExtra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
  },
};
