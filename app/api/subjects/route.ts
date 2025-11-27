import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allSubjects = await db.select().from(subjects);
    return NextResponse.json(allSubjects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const existing = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, body.id))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Subject with this id already exists' },
        { status: 400 }
      );
    }
    
    const [newSubject] = await db.insert(subjects).values({
      id: body.id,
      name: body.name,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json(newSubject);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

