import { Link2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

const AppHeader = () => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <SidebarTrigger />
          <div className='flex items-center ml-4'>
            <Link2 className="h-7 w-7 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-foreground">
              CraftyLink
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
