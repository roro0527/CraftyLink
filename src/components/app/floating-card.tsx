'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFloatingCard } from '@/hooks/use-floating-card';

export function FloatingCard() {
  const { isOpen, onClose } = useFloatingCard();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">도움이 필요하신가요?</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            궁금한 점이 있으시면 언제든지 문의해주세요.
          </p>
          <Button className="mt-4 w-full">문의하기</Button>
        </CardContent>
      </Card>
    </div>
  );
}
