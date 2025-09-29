
'use client';

/**
 * @file 전역 애플리케이션 헤더 컴포넌트입니다.
 * 로고, 네비게이션 링크, 모바일 메뉴 트리거를 포함합니다.
 */

import { Link2, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';


interface AppHeaderProps {}

const AppHeader: React.FC<AppHeaderProps> = ({}) => {
  const { onOpen } = useMobileSidebar();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

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
          <div className="flex-grow flex justify-end items-center gap-4">
            {/* 데스크탑 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button asChild variant="ghost" className="text-base"><Link href="/">홈</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/keyword">키워드</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/compare">비교</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/region-explore">탐색</Link></Button>
            </nav>
            {/* 로그인/사용자 정보 버튼 */}
            {loading ? (
                 <Skeleton className="h-10 w-24 rounded-lg" />
            ): user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-10">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                       <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                     <span className="hidden sm:inline">{user.displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                <Button onClick={signInWithGoogle}>로그인</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
