import { Link2 } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="border-b border-border/50 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <Link2 className="h-7 w-7 text-primary" />
          <h1 className="ml-3 text-2xl font-bold text-foreground">
            CraftyLink
          </h1>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
