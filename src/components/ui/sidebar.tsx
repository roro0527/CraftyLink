
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const { isOpen, onClose } = useMobileSidebar();
  const pathname = usePathname();

  const handleLinkClick = () => {
    onClose();
  };

  const navItems = [
    { href: '/', label: '홈' },
    { href: '/keyword', label: '키워드' },
    { href: '/compare', label: '비교' },
    { href: '/region-explore', label: '탐색' },
  ];

  const NavLinks = ({ className }: { className?: string}) => (
     <nav className={cn("flex flex-col gap-2 p-4", className)}>
        {navItems.map(item => (
            <Button 
                key={item.href}
                asChild 
                variant={pathname === item.href ? "secondary" : "ghost"} 
                className="w-full justify-start"
                onClick={handleLinkClick}
            >
                <Link href={item.href}>{item.label}</Link>
            </Button>
        ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 pt-16 w-64">
           <NavLinks />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r">
          <NavLinks />
      </aside>
    </>
  );
}
