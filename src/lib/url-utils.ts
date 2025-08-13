import { nanoid } from 'nanoid';
import type { ParsedUrl, SuperParam } from '@/lib/types';

export function parseUrlsFromString(text: string): ParsedUrl[] {
  const lines = text.split(/[\n\r]+/).filter(line => line.trim() !== '');
  const parsed: ParsedUrl[] = [];

  for (const line of lines) {
    try {
      const url = new URL(line);
      const baseUrl = `${url.origin}${url.pathname}`;
      const params = Array.from(url.searchParams.entries()).map(([key, value]) => ({
        id: nanoid(),
        key,
        value,
      }));
      parsed.push({
        id: nanoid(),
        originalUrl: line,
        baseUrl,
        params,
      });
    } catch (error) {
      // Ignore invalid URLs
      console.warn(`Could not parse line as URL: ${line}`);
    }
  }

  return parsed;
}

function cartesian<T>(...arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
        (acc, curr) => {
            return acc.flatMap(a => curr.map(c => [...a, c]));
        },
        [[]]
    );
}


export function generateUrlPermutations(baseUrl: string, superParams: SuperParam[]): string[] {
  if (superParams.length === 0) {
    return [baseUrl];
  }

  const paramValues = superParams.map(p => p.values.map(v => ({ name: p.name, value: v })));
  
  const combinations = cartesian(...paramValues);
  
  return combinations.map(combo => {
    const url = new URL(baseUrl);
    combo.forEach(param => {
      if(param.value) {
         url.searchParams.set(param.name, param.value);
      }
    });
    return url.toString();
  });
}
