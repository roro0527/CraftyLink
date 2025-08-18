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
      <Card className="w-96 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">요약</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="pb-4">
            <p className="text-sm text-muted-foreground">
              현재 페이지의 내용에 대한 요약 정보를 제공합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
