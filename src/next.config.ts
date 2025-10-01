import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const region = 'asia-northeast3';
    if (!projectId) {
        console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. API rewrites will not work.");
        return [];
    }

    // For local development, point to the Functions Emulator.
    // For production, point to the live Cloud Function URL.
    const functionBaseUrl = process.env.NODE_ENV === 'development'
        ? `http://127.0.0.1:5001/${projectId}/${region}`
        : `https://${region}-${projectId}.cloudfunctions.net`;

    return [
       {
        source: '/api/:path*',
        destination: `${functionBaseUrl}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' ,
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '*.*', // Allow all hostnames for Google Search images
      },
    ],
  },
};

export default nextConfig;
