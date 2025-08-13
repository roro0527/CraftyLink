import { Link2, Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import UrlInputSection from './url-input-section';
import * as React from 'react';


interface AppHeaderProps {
  urlsInput: string;
  onUrlsInputChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  urlsInput,
  onUrlsInputChange,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4">
        <div className="flex items-center h-16 py-3">
          <SidebarTrigger>
            <Menu className="h-7 w-7" />
          </SidebarTrigger>
          <div className='flex items-center ml-4'>
            <Link2 className="h-7 w-7 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-foreground">
              CraftyLink
            </h1>
          </div>
          <div className="flex-grow flex justify-end items-center gap-4">
            <div className="w-1/3 mt-5">
              <UrlInputSection
                urlsInput={urlsInput}
                onUrlsInputChange={onUrlsInputChange}
                onAnalyze={onAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </div>
            <nav className="hidden md:flex items-center space-x-2">
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
