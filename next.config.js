/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JWT_SECRET: 'your-super-secret-key', // IMPORTANT: Change this to a strong, unique secret!
  },
};

module.exports = nextConfig;
