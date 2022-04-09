/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "thrangra.sirv.com", // img 데이터의 URL 을 넣습니다.
    ],
  },
};

module.exports = nextConfig;
