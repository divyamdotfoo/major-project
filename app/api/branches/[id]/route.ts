import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches, students } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    const studentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.branch_id, id));
    
    return NextResponse.json({
      ...branch,
      student_count: studentCount[0]?.count || 0
    });
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
    
    const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    const [updated] = await db
      .update(branches)
      .set({
        branch_name: body.branch_name || branch.branch_name,
        description: body.description !== undefined ? body.description : branch.description,
        updated_at: new Date()
      })
      .where(eq(branches.id, id))
      .returning();
    
    const studentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.branch_id, id));
    
    return NextResponse.json({
      ...updated,
      student_count: studentCount[0]?.count || 0
    });
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
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    const [branch] = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    const studentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.branch_id, id));
    
    const count = studentCount[0]?.count || 0;
    
    if (count > 0 && !force) {
      return NextResponse.json(
        { error: `Cannot delete branch with ${count} students. Use force=true to delete anyway.` },
        { status: 400 }
      );
    }
    
    await db.delete(branches).where(eq(branches.id, id));
    
    return NextResponse.json({ 
      message: 'Branch deleted successfully',
      students_deleted: count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

