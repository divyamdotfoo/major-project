import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches } from '@/db/schema';
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
    
    const created_branches: string[] = [];
    const errors: string[] = [];
    
    for (let idx = 0; idx < data.length; idx++) {
      const row: any = data[idx];
      
      try {
        const branch_id = row.id?.toString().trim();
        const branch_name = row.branch_name?.toString().trim();
        
        if (!branch_id || !branch_name) {
          errors.push(`Row ${idx + 2}: Missing required fields (id or branch_name)`);
          continue;
        }
        
        const existing = await db
          .select()
          .from(branches)
          .where(eq(branches.id, branch_id))
          .limit(1);
        
        if (existing.length > 0) {
          errors.push(`Row ${idx + 2}: Branch ${branch_id} already exists`);
          continue;
        }
        
        await db.insert(branches).values({
          id: branch_id,
          branch_name: branch_name,
          description: row.description?.toString().trim() || null,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        created_branches.push(branch_id);
      } catch (error: any) {
        errors.push(`Row ${idx + 2}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: `Successfully created ${created_branches.length} branches`,
      created_count: created_branches.length,
      error_count: errors.length,
      created_branches,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

