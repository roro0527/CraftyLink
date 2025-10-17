
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

export type SearchCategory = 'photo' | 'news' | 'video';

export interface SearchResult {
  id: string;
  title: string;
  url: string; // The URL of the page where the image is.
  description?: string;
  imageUrl?: string; // The URL of the image itself.
  source?: string; // The domain of the source website.
  photographer_url?: string;
}
