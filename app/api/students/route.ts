import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, branches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch_id = searchParams.get('branch_id');
    
    let allStudents;
    if (branch_id) {
      allStudents = await db.select().from(students).where(eq(students.branch_id, branch_id));
    } else {
      allStudents = await db.select().from(students);
    }
    
    return NextResponse.json(allStudents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const [branch] = await db.select().from(branches).where(eq(branches.id, body.branch_id)).limit(1);
    
    if (!branch) {
      return NextResponse.json(
        { error: `Branch with id ${body.branch_id} not found` },
        { status: 404 }
      );
    }
    
    const existing = await db
      .select()
      .from(students)
      .where(eq(students.id, body.id))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Student with id ${body.id} already exists` },
        { status: 400 }
      );
    }
    
    const [newStudent] = await db.insert(students).values({
      id: body.id,
      name: body.name || null,
      email: body.email || null,
      phone: body.phone || null,
      branch_id: body.branch_id,
      semester: body.semester || null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json(newStudent);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

