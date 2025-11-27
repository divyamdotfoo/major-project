import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seatingPlans } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const plans = await db.select({
      id: seatingPlans.id,
      name: seatingPlans.name,
      exam_date: seatingPlans.exam_date,
      description: seatingPlans.description,
      total_students: seatingPlans.total_students,
      total_rooms: seatingPlans.total_rooms,
      data_source: seatingPlans.data_source,
      created_at: seatingPlans.created_at
    }).from(seatingPlans).orderBy(seatingPlans.created_at);
    
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

