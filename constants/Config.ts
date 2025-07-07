export const config = {
  app: {
    name: 'Fleet by MilesXP',
    version: '1.0.0',
  },
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    deviceValidationUrl: 'https://fleet.milesxp.com/api/driver-devices/validate',
  },
  storage: {
    authTokenKey: 'fleet_auth_token',
    userInfoKey: 'fleet_user_info',
    deviceValidationKey: 'fleet_device_validation',
  },
};