import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, branches } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json(student);
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
    
    const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    if (body.branch_id) {
      const [branch] = await db.select().from(branches).where(eq(branches.id, body.branch_id)).limit(1);
      if (!branch) {
        return NextResponse.json(
          { error: `Branch with id ${body.branch_id} not found` },
          { status: 404 }
        );
      }
    }
    
    const [updated] = await db
      .update(students)
      .set({
        name: body.name !== undefined ? body.name : student.name,
        email: body.email !== undefined ? body.email : student.email,
        phone: body.phone !== undefined ? body.phone : student.phone,
        branch_id: body.branch_id || student.branch_id,
        semester: body.semester !== undefined ? body.semester : student.semester,
        updated_at: new Date()
      })
      .where(eq(students.id, id))
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
    const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    await db.delete(students).where(eq(students.id, id));
    
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

