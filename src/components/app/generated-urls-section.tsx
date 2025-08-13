'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clipboard, ClipboardCheck, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface GeneratedUrlsSectionProps {
  generatedUrls: string[];
}

const GeneratedUrlsSection: React.FC<GeneratedUrlsSectionProps> = ({ generatedUrls }) => {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState('');
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  const filteredUrls = generatedUrls.filter(url => url.toLowerCase().includes(filter.toLowerCase()));

  const copyToClipboard = (text: string, url?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard!',
        description: url ? 'The URL has been copied.' : 'All generated URLs have been copied.',
      });
      if (url) {
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
      }
    });
  };

  const handleCopyAll = () => {
    const textToCopy = filteredUrls.join('\n');
    copyToClipboard(textToCopy);
  };

  const handleCopyOne = (url: string) => {
    copyToClipboard(url, url);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">4. Generated URLs</CardTitle>
        <CardDescription>
          Here are all the possible URL permutations based on your super-parameters. You can filter, copy, or open them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter URLs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCopyAll} variant="outline" disabled={filteredUrls.length === 0}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy All ({filteredUrls.length})
          </Button>
        </div>
        
        <ScrollArea className="h-72 w-full rounded-md border">
          <div className="p-4 font-mono text-sm">
            {filteredUrls.length > 0 ? (
              <ul className="space-y-2">
                <TooltipProvider>
                  {filteredUrls.map((url, index) => (
                    <li key={index} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline flex items-center gap-2">
                         <ExternalLink className="h-4 w-4 flex-shrink-0" />
                         <span className="truncate">{url}</span>
                      </a>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopyOne(url)}>
                            {copiedUrl === url ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy URL</p>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </TooltipProvider>
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No URLs match your filter.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GeneratedUrlsSection;
