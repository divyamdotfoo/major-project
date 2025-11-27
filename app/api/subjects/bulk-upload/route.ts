import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subjects } from '@/db/schema';
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
    
    const created_subjects: string[] = [];
    const errors: string[] = [];
    
    for (let idx = 0; idx < data.length; idx++) {
      const row: any = data[idx];
      
      try {
        const subject_id = row.id?.toString().trim();
        const subject_name = row.name?.toString().trim();
        
        if (!subject_id || !subject_name) {
          errors.push(`Row ${idx + 2}: Missing id or name`);
          continue;
        }
        
        const existing = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subject_id))
          .limit(1);
        
        if (existing.length > 0) {
          errors.push(`Row ${idx + 2}: Subject ${subject_id} already exists`);
          continue;
        }
        
        await db.insert(subjects).values({
          id: subject_id,
          name: subject_name,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        created_subjects.push(subject_id);
      } catch (error: any) {
        errors.push(`Row ${idx + 2}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: `Successfully created ${created_subjects.length} subjects`,
      created_count: created_subjects.length,
      error_count: errors.length,
      created_subjects,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

