'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';

export function Sidebar() {
  const { isOpen, onClose, onOpen } = useMobileSidebar();

  const handleLinkClick = () => {
    onClose();
  };

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
           <nav className="flex flex-col items-start p-4 space-y-2">
              <Button asChild variant="ghost" className="text-base w-full justify-start" onClick={handleLinkClick}><Link href="/">홈</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start" onClick={handleLinkClick}><Link href="/keyword">키워드</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start" onClick={handleLinkClick}><Link href="/compare">비교</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start" onClick={handleLinkClick}><Link href="/region-explore">지역 탐색</Link></Button>
            </nav>
        </SheetContent>
      </Sheet>
  );
}
