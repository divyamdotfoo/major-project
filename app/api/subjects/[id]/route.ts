import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    return NextResponse.json(subject);
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
    
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    const [updated] = await db
      .update(subjects)
      .set({
        name: body.name || subject.name,
        updated_at: new Date()
      })
      .where(eq(subjects.id, id))
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
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    await db.delete(subjects).where(eq(subjects.id, id));
    
    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

