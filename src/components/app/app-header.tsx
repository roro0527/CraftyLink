
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
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 py-3">
          {/* 모바일 햄버거 메뉴 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpen}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {/* 로고 및 앱 이름 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Link2 className="h-7 w-7 text-primary" />
              <h1 className="ml-3 text-2xl font-bold text-foreground">
                CraftyLink
              </h1>
            </Link>
          </div>
          {/* 네비게이션 및 액션 버튼 영역 */}
          <div className="flex-grow flex justify-end items-center gap-2">
            {/* 데스크탑 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button asChild variant="ghost" className="text-base"><Link href="/">홈</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/keyword">키워드</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/compare">비교</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/region-explore">탐색</Link></Button>
            </nav>
            {/* 로그인 버튼 */}
            <Button>로그인</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
