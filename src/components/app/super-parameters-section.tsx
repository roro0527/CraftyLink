'use client';

import * as React from 'react';
import type { SuperParam } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, LoaderCircle, Rocket, Plus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface SuperParametersSectionProps {
  superParams: SuperParam[];
  onUpdateSuperParam: (updatedParam: SuperParam) => void;
  onSuggest: () => void;
  onGenerate: () => void;
  isSuggesting: boolean;
}

const SuperParametersSection: React.FC<SuperParametersSectionProps> = ({
  superParams,
  onUpdateSuperParam,
  onSuggest,
  onGenerate,
  isSuggesting,
}) => {
  const [newValues, setNewValues] = React.useState<{[key: string]: string}>({});

  const handleFieldChange = (paramId: string, field: 'name' | 'description', value: string) => {
    const paramToUpdate = superParams.find(p => p.id === paramId);
    if(paramToUpdate) {
      onUpdateSuperParam({ ...paramToUpdate, [field]: value });
    }
  };

  const handleAddValue = (paramId: string) => {
    const paramToUpdate = superParams.find(p => p.id === paramId);
    const newValue = newValues[paramId]?.trim();
    if(paramToUpdate && newValue) {
      const updatedValues = [...paramToUpdate.values, newValue];
      onUpdateSuperParam({ ...paramToUpdate, values: updatedValues });
      setNewValues(current => ({ ...current, [paramId]: '' }));
    }
  };
  
  const handleRemoveValue = (paramId: string, valueToRemove: string) => {
    const paramToUpdate = superParams.find(p => p.id === paramId);
    if(paramToUpdate) {
      const updatedValues = paramToUpdate.values.filter(v => v !== valueToRemove);
      onUpdateSuperParam({ ...paramToUpdate, values: updatedValues });
    }
  };

  const handleNewValueChange = (paramId: string, value: string) => {
    setNewValues(current => ({...current, [paramId]: value}));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">3. 슈퍼 매개변수 구성</CardTitle>
        <CardDescription>
          AI를 사용하여 매개변수를 제안하거나 직접 정의하세요. 모든 URL 순열을 생성하는 데 사용됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Button onClick={onSuggest} disabled={isSuggesting} className="self-start" variant="outline" size="sm">
          {isSuggesting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          <span className="ml-2">AI로 추천받기</span>
        </Button>
        
        {isSuggesting && (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!isSuggesting && superParams.length === 0 && (
          <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
            <p>정의된 슈퍼 매개변수가 없습니다.</p>
            <p className="text-sm">"AI로 추천받기"를 클릭하거나 수동으로 추가하세요.</p>
          </div>
        )}

        {!isSuggesting && superParams.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {superParams.map(param => (
              <Card key={param.id} className="bg-background/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${param.id}`}>이름</Label>
                      <Input
                        id={`name-${param.id}`}
                        value={param.name}
                        onChange={(e) => handleFieldChange(param.id, 'name', e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`desc-${param.id}`}>설명</Label>
                      <Input
                        id={`desc-${param.id}`}
                        value={param.description}
                        onChange={(e) => handleFieldChange(param.id, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>값</Label>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-12 bg-background">
                        {param.values.map(v => (
                          <Badge key={v} variant="secondary" className="text-base">
                            {v}
                            <button onClick={() => handleRemoveValue(param.id, v)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="새 값 추가"
                        value={newValues[param.id] || ''}
                        onChange={(e) => handleNewValueChange(param.id, e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddValue(param.id)}
                      />
                      <Button size="sm" variant="secondary" onClick={() => handleAddValue(param.id)}>
                        <Plus className="h-4 w-4 mr-1" /> 추가
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button onClick={onGenerate} disabled={isSuggesting || superParams.length === 0}>
          <Rocket />
          <span className="ml-2">순열 생성</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuperParametersSection;
