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

export function Sidebar() {
  const { isOpen, onClose } = useMobileSidebar();

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
           <nav className="flex flex-col items-start p-4 space-y-2">
              <Button variant="ghost" className="text-base w-full justify-start">홈</Button>
              <Button variant="ghost" className="text-base w-full justify-start">탐색</Button>
              <Button variant="ghost" className="text-base w-full justify-start">실시간 인기</Button>
              <Button variant="ghost" className="text-base w-full justify-start">트렌드 분석</Button>
            </nav>
        </SheetContent>
      </Sheet>
  );
}
