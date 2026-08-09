import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Play } from '@/lib/draw';

const FILE = path.join(process.cwd(), 'data', 'jugada.json');

async function readPlay(): Promise<Play | null> {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    return JSON.parse(raw) as Play;
  } catch {
    return null; // archivo aún no existe
  }
}

export async function GET() {
  const play = await readPlay();
  return NextResponse.json({ play });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Play;

    if (
      !Array.isArray(body.nums) ||
      body.nums.length !== 5 ||
      typeof body.sb !== 'number' ||
      typeof body.fecha_sorteo !== 'string'
    ) {
      return NextResponse.json({ error: 'Jugada inválida' }, { status: 400 });
    }

    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(body, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, play: body });
  } catch (error) {
    console.error('Error guardando jugada:', error);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
