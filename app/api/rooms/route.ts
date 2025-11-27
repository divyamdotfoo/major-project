import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allRooms = await db.select().from(rooms);
    return NextResponse.json(allRooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.rows <= 0 || body.cols <= 0) {
      return NextResponse.json(
        { error: 'rows and cols must be positive integers' },
        { status: 400 }
      );
    }
    
    const existing = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, body.id))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Room with id '${body.id}' already exists` },
        { status: 400 }
      );
    }
    
    const [newRoom] = await db.insert(rooms).values({
      id: body.id,
      rows: body.rows,
      cols: body.cols,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json(newRoom);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

