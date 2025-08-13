'use client';

import type { ParsedUrl, UrlParam } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

interface ParsedUrlsSectionProps {
  parsedUrls: ParsedUrl[];
  onUpdateParsedUrl: (updatedUrl: ParsedUrl) => void;
}

const ParsedUrlsSection: React.FC<ParsedUrlsSectionProps> = ({ parsedUrls, onUpdateParsedUrl }) => {
  
  const handleParamChange = (urlId: string, paramId: string, field: 'key' | 'value', value: string) => {
    const urlToUpdate = parsedUrls.find(url => url.id === urlId);
    if (urlToUpdate) {
      const updatedParams = urlToUpdate.params.map(p => p.id === paramId ? { ...p, [field]: value } : p);
      onUpdateParsedUrl({ ...urlToUpdate, params: updatedParams });
    }
  };

  const handleAddParam = (urlId: string) => {
    const urlToUpdate = parsedUrls.find(url => url.id === urlId);
    if(urlToUpdate) {
      const newParam: UrlParam = { id: nanoid(), key: '', value: '' };
      onUpdateParsedUrl({...urlToUpdate, params: [...urlToUpdate.params, newParam]});
    }
  }

  const handleDeleteParam = (urlId: string, paramId: string) => {
    const urlToUpdate = parsedUrls.find(url => url.id === urlId);
    if(urlToUpdate) {
      const updatedParams = urlToUpdate.params.filter(p => p.id !== paramId);
      onUpdateParsedUrl({...urlToUpdate, params: updatedParams});
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">2. Review Parsed Data</CardTitle>
        <CardDescription>
          Review the parsed URLs and their parameters. You can edit the values if needed. The first URL's base path will be used for generation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[parsedUrls[0]?.id]} className="w-full">
          {parsedUrls.map((url) => (
            <AccordionItem value={url.id} key={url.id}>
              <AccordionTrigger className="font-mono text-sm hover:no-underline">
                <span className="truncate">{url.originalUrl}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Base URL</p>
                    <p className="font-mono bg-background p-2 rounded">{url.baseUrl}</p>
                    <p className="text-sm text-muted-foreground mt-4 mb-2">Parameters</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {url.params.map((param) => (
                          <TableRow key={param.id}>
                            <TableCell>
                              <Input
                                value={param.key}
                                onChange={(e) => handleParamChange(url.id, param.id, 'key', e.target.value)}
                                className="font-mono"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={param.value}
                                onChange={(e) => handleParamChange(url.id, param.id, 'value', e.target.value)}
                                className="font-mono"
                              />
                            </TableCell>
                            <TableCell>
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteParam(url.id, param.id)}>
                                 <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                     <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddParam(url.id)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter
                      </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ParsedUrlsSection;
