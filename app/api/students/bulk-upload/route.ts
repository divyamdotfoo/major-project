import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, branches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const created_students: string[] = [];
    const errors: string[] = [];
    
    for (let idx = 0; idx < data.length; idx++) {
      const row: any = data[idx];
      
      try {
        const student_id = row.id?.toString().trim();
        const branch_id = row.branch?.toString().trim();
        
        if (!student_id || !branch_id) {
          errors.push(`Row ${idx + 2}: Missing required fields (id or branch)`);
          continue;
        }
        
        const [branch] = await db
          .select()
          .from(branches)
          .where(eq(branches.id, branch_id))
          .limit(1);
        
        if (!branch) {
          errors.push(`Row ${idx + 2}: Branch '${branch_id}' not found`);
          continue;
        }
        
        const existing = await db
          .select()
          .from(students)
          .where(eq(students.id, student_id))
          .limit(1);
        
        if (existing.length > 0) {
          errors.push(`Row ${idx + 2}: Student ${student_id} already exists`);
          continue;
        }
        
        await db.insert(students).values({
          id: student_id,
          name: row.name?.toString().trim() || null,
          email: row.email?.toString().trim() || null,
          phone: row.phone?.toString().trim() || null,
          branch_id: branch_id,
          semester: row.semester ? parseInt(row.semester) : null,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        created_students.push(student_id);
      } catch (error: any) {
        errors.push(`Row ${idx + 2}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: `Successfully created ${created_students.length} students`,
      created_count: created_students.length,
      error_count: errors.length,
      created_students,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

