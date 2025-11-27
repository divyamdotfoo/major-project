import { NextRequest, NextResponse } from 'next/server';
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
    
    const required_columns = ['room_id', 'rows', 'cols'];
    if (data.length > 0) {
      const firstRow: any = data[0];
      const hasAllColumns = required_columns.every(col => col in firstRow);
      if (!hasAllColumns) {
        return NextResponse.json(
          { error: `Excel file must contain columns: ${required_columns.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    const rooms = data.map((row: any) => ({
      room_id: String(row.room_id),
      rows: parseInt(row.rows),
      cols: parseInt(row.cols)
    }));
    
    return NextResponse.json({ rooms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

