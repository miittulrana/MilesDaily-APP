export const config = {
  app: {
    name: 'Fleet by MilesXP',
    version: '1.0.0',
  },
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  storage: {
    authTokenKey: 'fleet_auth_token',
    userInfoKey: 'fleet_user_info',
  },
};