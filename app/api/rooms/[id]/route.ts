import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    return NextResponse.json(room);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const [updated] = await db
      .update(rooms)
      .set({
        rows: body.rows !== undefined ? body.rows : room.rows,
        cols: body.cols !== undefined ? body.cols : room.cols,
        updated_at: new Date()
      })
      .where(eq(rooms.id, id))
      .returning();
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    await db.delete(rooms).where(eq(rooms.id, id));
    
    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

