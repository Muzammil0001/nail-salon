/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `image.${process.env.NEXT_PUBLIC_URL}`,
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/julietnails",
        permanent: false,
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Exclude server-side modules that cannot be used on the client side
      config.resolve.fallback = {
        fs: false,
        path: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
