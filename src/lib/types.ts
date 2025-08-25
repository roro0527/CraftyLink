
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
}
