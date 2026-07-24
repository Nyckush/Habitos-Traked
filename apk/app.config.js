const appJson = require('./app.json');

const config = appJson.expo ?? {};
const configExtra =
  typeof config.extra === 'object' && config.extra
    ? config.extra
    : {};
const androidConfig =
  typeof config.android === 'object' && config.android
    ? config.android
    : {};

module.exports = {
  ...config,
  android: {
    ...androidConfig,
    package: androidConfig.package ?? 'com.nickush.habitrackedmobile',
  },
  plugins: [...(config.plugins ?? []), 'expo-sqlite'],
  extra: {
    ...configExtra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
    eas: {
      ...(typeof configExtra.eas === 'object' && configExtra.eas ? configExtra.eas : {}),
      projectId: '2c3548ee-d57b-4912-9966-ec813ce61829',
    },
  },
};
