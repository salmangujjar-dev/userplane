/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // Webpack config for production builds (when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'pino-pretty': false,
      };

      // Ignore pino-pretty and other server-only modules in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pino-pretty': 'commonjs pino-pretty',
        'thread-stream': 'commonjs thread-stream',
        'sonic-boom': 'commonjs sonic-boom',
      });
    }
    return config;
  },
  // Turbopack doesn't need the webpack externals config
  // It properly handles server-only imports out of the box
}

export default nextConfig
