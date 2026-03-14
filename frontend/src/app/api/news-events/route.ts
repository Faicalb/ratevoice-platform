import { NextResponse } from 'next/server';
import { newsEngine } from '@/lib/api/news-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || undefined;
  const country = searchParams.get('country') || undefined;
  const type = searchParams.get('type') as 'news' | 'event' | undefined;

  const data = await newsEngine.fetchLatest({ city, country, type });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newItem = await newsEngine.create(body);
  return NextResponse.json(newItem);
}
