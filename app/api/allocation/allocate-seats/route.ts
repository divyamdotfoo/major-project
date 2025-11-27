import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branches, students, rooms } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

function allocateSeatsRoundRobin(
  class1_students: any[],
  class2_students: any[],
  rows: number,
  cols: number
): string[][][] {
  const grid: string[][][] = [];
  
  const used_class1_indices = new Set<number>();
  const used_class2_indices = new Set<number>();
  
  const available_class1_indices = Array.from({ length: class1_students.length }, (_, i) => i);
  const available_class2_indices = Array.from({ length: class2_students.length }, (_, i) => i);
  
  for (let row = 0; row < rows; row++) {
    const row_data: string[][] = [];
    for (let col = 0; col < cols; col++) {
      let bench: string[] = [];
      
      let student1_index: number | null = null;
      let student1 = null;
      
      if (available_class1_indices.length > 0) {
        student1_index = available_class1_indices[0];
        student1 = class1_students[student1_index];
      }
      
      if (student1_index === null) {
        if (available_class2_indices.length > 0) {
          const student2_index = available_class2_indices[0];
          const student2 = class2_students[student2_index];
          bench.push(student2.roll_no);
          used_class2_indices.add(student2_index);
          available_class2_indices.shift();
        }
        row_data.push(bench);
        continue;
      }
      
      let found_pair = false;
      
      for (let i = 0; i < available_class2_indices.length; i++) {
        const idx = available_class2_indices[i];
        const student2 = class2_students[idx];
        
        if (student1.course !== student2.course) {
          bench.push(student1.roll_no);
          bench.push(student2.roll_no);
          
          used_class1_indices.add(student1_index);
          used_class2_indices.add(idx);
          available_class1_indices.shift();
          available_class2_indices.splice(i, 1);
          found_pair = true;
          break;
        }
      }
      
      if (!found_pair && available_class2_indices.length > 0) {
        const student2_index = available_class2_indices[0];
        const student2 = class2_students[student2_index];
        bench.push(student1.roll_no);
        bench.push(student2.roll_no);
        
        used_class1_indices.add(student1_index);
        used_class2_indices.add(student2_index);
        available_class1_indices.shift();
        available_class2_indices.shift();
        found_pair = true;
      }
      
      if (!found_pair) {
        bench.push(student1.roll_no);
        used_class1_indices.add(student1_index);
        available_class1_indices.shift();
      }
      
      row_data.push(bench);
    }
    
    grid.push(row_data);
  }
  
  return grid;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const [branch1] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, body.branch1_id))
      .limit(1);
    
    if (!branch1) {
      return NextResponse.json(
        { error: `Branch with id ${body.branch1_id} not found` },
        { status: 404 }
      );
    }
    
    const [branch2] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, body.branch2_id))
      .limit(1);
    
    if (!branch2) {
      return NextResponse.json(
        { error: `Branch with id ${body.branch2_id} not found` },
        { status: 404 }
      );
    }
    
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, body.room_id))
      .limit(1);
    
    if (!room) {
      return NextResponse.json(
        { error: `Room with id ${body.room_id} not found` },
        { status: 404 }
      );
    }
    
    const branch1_students = await db
      .select()
      .from(students)
      .where(eq(students.branch_id, body.branch1_id));
    
    const branch2_students = await db
      .select()
      .from(students)
      .where(eq(students.branch_id, body.branch2_id));
    
    if (branch1_students.length === 0) {
      return NextResponse.json(
        { error: `Branch '${branch1.branch_name}' has no students` },
        { status: 400 }
      );
    }
    
    if (branch2_students.length === 0) {
      return NextResponse.json(
        { error: `Branch '${branch2.branch_name}' has no students` },
        { status: 400 }
      );
    }
    
    const class1_students = branch1_students.map(student => ({
      roll_no: student.id,
      name: student.name,
      course: branch1.id
    }));
    
    const class2_students = branch2_students.map(student => ({
      roll_no: student.id,
      name: student.name,
      course: branch2.id
    }));
    
    const rows_count = room.rows;
    const cols_count = room.cols;
    const total_capacity = rows_count * cols_count * 2;
    
    if (rows_count === 0 || cols_count === 0) {
      return NextResponse.json(
        { error: `Room '${room.id}' has invalid configuration` },
        { status: 400 }
      );
    }
    
    const total_students = class1_students.length + class2_students.length;
    if (total_students > total_capacity) {
      return NextResponse.json(
        { error: `Total students (${total_students}) exceeds room capacity (${total_capacity})` },
        { status: 400 }
      );
    }
    
    const grid = allocateSeatsRoundRobin(class1_students, class2_students, rows_count, cols_count);
    
    const date_str = body.date || new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const seating_data = {
      hall: room.id,
      date: date_str,
      grid,
      branch1: branch1.branch_name,
      branch2: branch2.branch_name,
      total_students_branch1: class1_students.length,
      total_students_branch2: class2_students.length,
      room_configuration: {
        rows: rows_count,
        cols: cols_count,
        total_capacity
      }
    };
    
    return NextResponse.json(seating_data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

