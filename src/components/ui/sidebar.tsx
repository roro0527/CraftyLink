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
  const { isOpen, onClose } = useMobileSidebar();

  const handleLinkClick = () => {
    onClose();
  };

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 pt-16">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
           <nav className="flex flex-col items-start p-4 space-y-2">
              <Button asChild variant="ghost" className="text-base w-full justify-start"><Link href="/" onClick={handleLinkClick}>홈</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start"><Link href="/keyword" onClick={handleLinkClick}>키워드</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start"><Link href="/compare" onClick={handleLinkClick}>비교</Link></Button>
              <Button asChild variant="ghost" className="text-base w-full justify-start"><Link href="/region-explore" onClick={handleLinkClick}>지역탐색</Link></Button>
            </nav>
        </SheetContent>
      </Sheet>
  );
}
