
import { z } from 'zod';

export interface SuperParam {
  id: string;
  name: string;
  value: string | number;
  type: 'text' | 'number' | 'boolean';
  description: string;
}

export interface KeywordTrendPoint {
    date: string; // "YYYY-MM-DD"
    value: number;
}

export interface YoutubeVideo {
    title: string;
    publishedAt: string;
    viewCount: string;
    channelTitle: string;
    growthRate?: number;
}


// Schema for Gender/Age Trend Data
export const GenderAgeTrendInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  startDate: z.string().describe('The start date in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date in YYYY-MM-DD format.'),
});
export type GenderAgeTrendInput = z.infer<typeof GenderAgeTrendInputSchema>;

export const GenderAgeTrendDataSchema = z.object({
  genderGroups: z.array(z.object({
    group: z.string(), // 'm' or 'f'
    ratio: z.number(),
  })),
  ageGroups: z.array(z.object({
    group: z.string(), // '10s', '20s', etc.
    ratio: z.number(),
  })),
});
export type GenderAgeTrendData = z.infer<typeof GenderAgeTrendDataSchema>;


// Schema for Seasonal Pattern Data
export const SeasonalPatternInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  startDate: z.string().describe('The start date in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date in YYYY-MM-DD format.'),
  timeUnit: z.enum(['month', 'week']).default('month'),
});
export type SeasonalPatternInput = z.infer<typeof SeasonalPatternInputSchema>;

export const SeasonalPatternDataSchema = z.array(z.object({
    date: z.string().describe("The date for the data point (YYYY-MM-DD)."),
    value: z.number().describe("The search trend value."),
}));
export type SeasonalPatternData = z.infer<typeof SeasonalPatternDataSchema>;
