export type UrlParam = {
  id: string;
  key: string;
  value: string;
};

export type ParsedUrl = {
  id: string;
  originalUrl: string;
  baseUrl: string;
  params: UrlParam[];
};

export type SuperParam = {
  id:string;
  name: string;
  description: string;
  values: string[];
};
