import { NextResponse } from 'next/server';

// Simple in-file storage as a fallback. In real deployment, replace with DB or provider.
// We will write to a JSONL file under .data/waitlist.jsonl relative to project root.
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'waitlist.jsonl');

export async function POST(req: Request) {
  try {
    const { email, name, plan = 'Ultimate', source = 'pricing' } = await req.json();

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const record = {
      name: typeof name === 'string' ? name.trim() : undefined,
      email: email.trim().toLowerCase(),
      plan,
      source,
      ua: req.headers.get('user-agent') || undefined,
      ts: new Date().toISOString(),
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(DATA_FILE, JSON.stringify(record) + '\n', 'utf8');

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  // Minimal CORS preflight support if ever needed
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}