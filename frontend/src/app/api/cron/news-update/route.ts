import { NextResponse } from 'next/server';
import { newsEngine } from '@/lib/api/news-engine';

export async function GET() {
  // In a real scenario, this would be protected by a CRON_SECRET header
  try {
    const report = await newsEngine.triggerEngineUpdate();
    return NextResponse.json({ 
      success: true, 
      message: 'News Engine Update Triggered', 
      report 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Engine failed' }, { status: 500 });
  }
}
