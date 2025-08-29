
'use client';

import * as React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeywordTrendPoint } from '@/lib/types';

const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface HomeTrendChartProps {
  data: KeywordTrendPoint[] | undefined;
  isLoading: boolean;
}

const HomeTrendChart: React.FC<HomeTrendChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full bg-muted-foreground/10 rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => format(parseISO(value), 'M/d', { locale: ko })}
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          width={30}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};

export default HomeTrendChart;
