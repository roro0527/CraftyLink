
'use client';

/**
 * @file 전역 애플리케이션 헤더 컴포넌트입니다.
 * 로고, 네비게이션 링크, 모바일 메뉴 트리거를 포함합니다.
 */

import { Link2, Menu, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '../ui/skeleton';

interface AppHeaderProps {}

const AppHeader: React.FC<AppHeaderProps> = ({}) => {
  const { onOpen } = useMobileSidebar();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const UserButton = () => {
    if (loading) {
      return <Skeleton className="h-10 w-10 rounded-full" />;
    }
    
    if (!user) {
      return (
        <Button onClick={signInWithGoogle}>
            <LogIn className="mr-2 h-4 w-4" />
            로그인
        </Button>
      );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }


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
            <UserButton />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
