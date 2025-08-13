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
        <CardTitle className="text-2xl">2. 분석된 데이터 검토</CardTitle>
        <CardDescription>
          분석된 URL과 해당 매개변수를 검토하세요. 필요한 경우 값을 편집할 수 있습니다. 첫 번째 URL의 기본 경로는 생성에 사용됩니다.
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
                    <p className="text-sm text-muted-foreground mb-1">기준 URL</p>
                    <p className="font-mono bg-background p-2 rounded">{url.baseUrl}</p>
                    <p className="text-sm text-muted-foreground mt-4 mb-2">매개변수</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>키</TableHead>
                          <TableHead>값</TableHead>
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
                        <PlusCircle className="mr-2 h-4 w-4" /> 매개변수 추가
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
