const appJson = require('./app.json');

module.exports = () => {
    const isExpoGo = process.env.EXPO_GO === '1';

    return {
        ...appJson,
        expo: {
            ...appJson.expo,
            updates: isExpoGo
                ? { enabled: false }
                : appJson.expo.updates,
            ...(isExpoGo ? {} : { runtimeVersion: appJson.expo.runtimeVersion }),
        },
    };
};