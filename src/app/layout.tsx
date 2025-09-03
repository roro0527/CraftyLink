import type {Metadata} from 'next';
import './globals.css';
import AppHeader from '@/components/app/app-header';
import { Sidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'CraftyLink',
  description: '키워드 기반 URL 검색',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Script
            strategy="beforeInteractive"
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`}
        />
        <div className="min-h-screen bg-background text-foreground">
          <AppHeader />
          <Sidebar />
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
