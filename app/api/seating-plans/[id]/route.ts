import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seatingPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [plan] = await db
      .select()
      .from(seatingPlans)
      .where(eq(seatingPlans.id, parseInt(id)))
      .limit(1);
    
    if (!plan) {
      return NextResponse.json({ error: 'Seating plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      ...plan,
      allocation_data: JSON.parse(plan.allocation_data)
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
    
    const [plan] = await db
      .select()
      .from(seatingPlans)
      .where(eq(seatingPlans.id, parseInt(id)))
      .limit(1);
    
    if (!plan) {
      return NextResponse.json({ error: 'Seating plan not found' }, { status: 404 });
    }
    
    const [updated] = await db
      .update(seatingPlans)
      .set({
        name: body.name !== undefined ? body.name : plan.name,
        exam_date: body.exam_date !== undefined ? body.exam_date : plan.exam_date,
        description: body.description !== undefined ? body.description : plan.description,
        updated_at: new Date()
      })
      .where(eq(seatingPlans.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      ...updated,
      allocation_data: JSON.parse(updated.allocation_data)
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
    const [plan] = await db
      .select()
      .from(seatingPlans)
      .where(eq(seatingPlans.id, parseInt(id)))
      .limit(1);
    
    if (!plan) {
      return NextResponse.json({ error: 'Seating plan not found' }, { status: 404 });
    }
    
    await db.delete(seatingPlans).where(eq(seatingPlans.id, parseInt(id)));
    
    return NextResponse.json({ message: 'Seating plan deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

