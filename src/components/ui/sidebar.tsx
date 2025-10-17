
'use client';

import * as React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useCompareStore, type SavedComparison } from '@/store/compare-store';
import { Separator } from './separator';
import { ScrollArea } from './scroll-area';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase, useFirestore } from '@/firebase/provider';
import { collection, query, where, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from './skeleton';

export function Sidebar() {
  const { isOpen, onClose } = useMobileSidebar();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, loading: userLoading } = useAuth();
  const firestore = useFirestore();
  const { setKeywords } = useCompareStore();

  // Firestore 쿼리 생성
  const savedItemsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'savedComparisonPages')
    );
  }, [user, firestore]);

  // useCollection 훅으로 데이터 실시간 수신
  const { data: savedItems, isLoading: isLoadingItems } = useCollection<SavedComparison>(savedItemsQuery);

  const handleLinkClick = () => {
    onClose();
  };

  const handleLoadComparison = (keywords: string[]) => {
    setKeywords(keywords);
    toast({
      title: '불러오기 완료',
      description: `"${keywords.join(', ')}" 비교를 불러왔습니다.`,
    });
    onClose(); // 모바일에서 항목 클릭 시 사이드바 닫기
  };

  const handleDeleteComparison = (id: string, name: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'savedComparisonPages', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "삭제 완료",
      description: `'${name}' 항목이 삭제되었습니다.`,
    });
  };

  const navItems = [
    { href: '/', label: '홈' },
    { href: '/keyword', label: '키워드' },
    { href: '/compare', label: '비교' },
    { href: '/region-explore', label: '탐색' },
  ];

  const NavLinks = ({ className }: { className?: string }) => (
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

  const SavedComparisons = () => {
    if (userLoading) {
      return (
        <div className="p-4 space-y-2">
            <h2 className="text-lg font-semibold mb-2 px-2">저장된 비교</h2>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
      )
    }

    if (!user) {
        return (
             <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 px-2">저장된 비교</h2>
                <p className="text-sm text-muted-foreground px-2">로그인하여 비교 결과를 저장하고 불러오세요.</p>
            </div>
        )
    }
    
    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-2 px-2">저장된 비교</h2>
            {isLoadingItems ? (
                 <div className="space-y-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                 </div>
            ) : savedItems && savedItems.length > 0 ? (
              <div className="space-y-1">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg hover:bg-accent group"
                  >
                    <Link
                        href="/compare"
                        className="flex items-center gap-3 cursor-pointer flex-grow p-2"
                        onClick={() => handleLoadComparison(item.keywords)}
                    >
                      <span className={`h-3 w-3 rounded-full ${item.color}`}></span>
                      <span className="font-medium text-sm truncate flex-1">{item.name}</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComparison(item.id, item.name);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete comparison</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground px-2">저장된 항목이 없습니다.</p>
            )}
        </div>
    );
  }


  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <NavLinks />
        <Separator />
        <ScrollArea className="flex-1">
            <SavedComparisons />
        </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 pt-16 w-64">
           <SidebarContent />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r">
          <SidebarContent />
      </aside>
    </>
  );
}
