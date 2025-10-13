
'use client';

/**
 * @file 전역 애플리케이션 헤더 컴포넌트입니다.
 * 로고, 네비게이션 링크, 모바일 메뉴 트리거를 포함합니다.
 */

import { Link2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';

interface AppHeaderProps {}

const AppHeader: React.FC<AppHeaderProps> = ({}) => {
  const { onOpen } = useMobileSidebar();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="container flex items-center h-16 max-w-screen-2xl">
        {/* 모바일 햄버거 메뉴 버튼 */}
        <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpen}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
        </div>
        {/* 로고 및 앱 이름 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Link2 className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground hidden md:block">
              CraftyLink
            </h1>
          </Link>
        </div>
        {/* 네비게이션 및 액션 버튼 영역 */}
        <div className="flex-1 flex justify-end items-center gap-4">
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
