import { NextResponse } from 'next/server';
import { getBirdingData } from '@/lib/data';

export async function GET() {
  try {
    const data = getBirdingData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching birding data:', error);
    return NextResponse.json({ error: 'Failed to load birding data' }, { status: 500 });
  }
}
