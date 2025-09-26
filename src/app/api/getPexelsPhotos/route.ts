
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!PEXELS_API_KEY) {
    console.error("Pexels API key is not configured.");
    return NextResponse.json({ error: "Pexels API key is not configured." }, { status: 500 });
  }

  try {
    const url = 'https://api.pexels.com/v1/search';
    const response = await axios.get(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      params: {
        query,
        per_page: 12,
        page,
      },
    });

    const photos = response.data.photos.map((photo: any) => ({
      id: photo.id,
      title: photo.alt || 'Pexels Photo',
      url: photo.url,
      imageUrl: photo.src.medium, // Changed from thumbnailUrl to imageUrl
      description: `Photo by ${photo.photographer}`,
      photographer_url: photo.photographer_url,
      source: 'Pexels',
    }));

    const hasMore = response.data.next_page !== undefined;

    return NextResponse.json({ photos, hasMore });
  } catch (error: any) {
    console.error("Pexels API call failed:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch photos from Pexels." }, { status: 500 });
  }
}
