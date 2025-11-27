import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
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
    
    const created_rooms: string[] = [];
    const errors: string[] = [];
    
    for (let idx = 0; idx < data.length; idx++) {
      const row: any = data[idx];
      
      try {
        const room_id = row.id?.toString().trim();
        const rows_val = parseInt(row.rows);
        const cols_val = parseInt(row.cols);
        
        if (!room_id || !rows_val || !cols_val || rows_val <= 0 || cols_val <= 0) {
          errors.push(`Row ${idx + 2}: Invalid or missing required fields`);
          continue;
        }
        
        const existing = await db
          .select()
          .from(rooms)
          .where(eq(rooms.id, room_id))
          .limit(1);
        
        if (existing.length > 0) {
          errors.push(`Row ${idx + 2}: Room '${room_id}' already exists`);
          continue;
        }
        
        await db.insert(rooms).values({
          id: room_id,
          rows: rows_val,
          cols: cols_val,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        created_rooms.push(room_id);
      } catch (error: any) {
        errors.push(`Row ${idx + 2}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: `Successfully created ${created_rooms.length} rooms`,
      created_count: created_rooms.length,
      error_count: errors.length,
      created_rooms,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

