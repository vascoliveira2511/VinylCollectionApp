/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JWT_SECRET: 'your-super-secret-key', // IMPORTANT: Change this to a strong, unique secret!
    // Development Discogs OAuth
    DISCOGS_CLIENT_KEY: process.env.NODE_ENV === 'production' ? 'xmnJzMNtYyqNXeCnGPgv' : 'NsabApbUALgscalkaUlE',
    DISCOGS_CLIENT_SECRET: process.env.NODE_ENV === 'production' ? 'yefdCSAbYsMZnvzHZFTlMLaAiVWazFfb' : 'RSTHmrMYOhhxTzNUNRsDJKXPmXEClaOR',
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'production' ? 'https://vinyl-collection-app-ruby.vercel.app' : 'http://localhost:3000',
  },
};

module.exports = nextConfig;
