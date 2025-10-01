import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppHeader from '@/components/app/app-header';
import { Sidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
    <html lang="ko" className={inter.variable}>
      <head>
        {/* Google Fonts link is handled by next/font */}
      </head>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background text-foreground">
          <div className="flex flex-col">
            <AppHeader />
            <div className="flex-1">
              <div className="flex">
                <Sidebar />
                <main className="flex-1 pl-0 md:pl-64">
                    {children}
                </main>
              </div>
            </div>
          </div>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
