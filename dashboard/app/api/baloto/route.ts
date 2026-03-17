import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    const response = await fetch('https://www.baloto.com/', {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // El bloque "accumulated-1" contiene el acumulado de BALOTO (no Revancha)
    // El elemento con clase "accum-integer" dentro tiene el valor ej: "$27.600"
    let jackpot = '---';
    const acc1 = $('.accumulated-1');
    if (acc1.length > 0) {
      const integerEl = acc1.find('.accum-integer').first();
      if (integerEl.length > 0) {
        // Texto: "$27.600" → queremos "27.600 M"
        const raw = integerEl.text().trim().replace('$', '').trim();
        jackpot = `$${raw} M`;
      }
    }

    return NextResponse.json({ jackpot });
  } catch (error) {
    console.error('Error scraping jackpot:', error);
    return NextResponse.json({ jackpot: '---' });
  }
}
