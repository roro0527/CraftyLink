'use client';

import { Link2, Menu, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import { useFloatingCard } from '@/hooks/use-floating-card';
import Link from 'next/link';

interface AppHeaderProps {}

const AppHeader: React.FC<AppHeaderProps> = ({}) => {
  const { onOpen } = useMobileSidebar();
  const { onOpen: onOpenCard } = useFloatingCard();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpen}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className='flex items-center ml-4'>
            <Link href="/" className="flex items-center">
              <Link2 className="h-7 w-7 text-primary" />
              <h1 className="ml-3 text-2xl font-bold text-foreground">
                CraftyLink
              </h1>
            </Link>
          </div>
          <div className="flex-grow flex justify-end items-center gap-4">
            <nav className="hidden md:flex items-center space-x-2">
              <Button asChild variant="ghost" className="text-base"><Link href="/">홈</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/keyword">키워드</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/compare">비교</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/region-explore">지역 탐색</Link></Button>
              <Button asChild variant="ghost" className="text-base"><Link href="/summary">요약</Link></Button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
