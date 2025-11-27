import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches, students } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const allBranches = await db.select().from(branches);
    
    const branchesWithCount = await Promise.all(
      allBranches.map(async (branch) => {
        const studentCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(students)
          .where(eq(students.branch_id, branch.id));
        
        return {
          ...branch,
          student_count: studentCount[0]?.count || 0
        };
      })
    );
    
    return NextResponse.json(branchesWithCount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const existing = await db
      .select()
      .from(branches)
      .where(eq(branches.id, body.id))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Branch with this id already exists' },
        { status: 400 }
      );
    }
    
    const [newBranch] = await db.insert(branches).values({
      id: body.id,
      branch_name: body.branch_name,
      description: body.description || null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json({ ...newBranch, student_count: 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

