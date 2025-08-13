import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';

interface AppHeaderProps {}

const AppHeader: React.FC<AppHeaderProps> = ({}) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 py-3">
          <div className='flex items-center'>
            <Link2 className="h-7 w-7 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-foreground">
              CraftyLink
            </h1>
          </div>
          <div className="flex-grow flex justify-end items-center gap-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" className="text-base">홈</Button>
              <Button variant="ghost" className="text-base">탐색</Button>
              <Button variant="ghost" className="text-base">실시간 인기</Button>
              <Button variant="ghost" className="text-base">트렌드 분석</Button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
