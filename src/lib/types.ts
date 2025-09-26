
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
    id: string;
    title: string;
    publishedAt: string;
    viewCount: string;
    channelTitle: string;
}

export type SearchCategory = 'photo' | 'news' | 'dictionary' | 'video';

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  source?: string;
  photographer_url?: string;
}
