import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seatingPlans, branches, subjects } from '@/db/schema';

function allocateStudentsToRooms(students_data: any[], rooms_data: any[]) {
  const allocations = [];
  const student_queue = [...students_data];
  
  for (const room of rooms_data) {
    const room_id = room.room_id;
    const rows = room.rows;
    const cols = room.cols;
    const capacity = rows * cols * 2;
    
    const subject_groups: { [key: string]: any[] } = {};
    for (const student of student_queue) {
      const subject = student.subject;
      if (!subject_groups[subject]) {
        subject_groups[subject] = [];
      }
      subject_groups[subject].push(student);
    }
    
    const room_allocation = {
      room_id,
      rows,
      cols,
      grid: [] as any[][]
    };
    
    let students_allocated = 0;
    
    for (let row_idx = 0; row_idx < rows; row_idx++) {
      const row_data: any[][] = [];
      for (let col_idx = 0; col_idx < cols; col_idx++) {
        let bench: any[] = [];
        
        const subject_keys = Object.keys(subject_groups);
        
        if (subject_keys.length >= 2) {
          const subject1 = subject_keys[0];
          const subject2 = subject_keys[1];
          
          if (subject_groups[subject1].length > 0 && subject_groups[subject2].length > 0) {
            const student1 = subject_groups[subject1].shift();
            const student2 = subject_groups[subject2].shift();
            bench = [student1, student2];
            const idx1 = student_queue.findIndex(s => s.roll_no === student1.roll_no);
            const idx2 = student_queue.findIndex(s => s.roll_no === student2.roll_no);
            if (idx1 > -1) student_queue.splice(idx1, 1);
            if (idx2 > -1) student_queue.splice(idx2, 1);
            students_allocated += 2;
            
            if (subject_groups[subject1].length === 0) delete subject_groups[subject1];
            if (subject_groups[subject2].length === 0) delete subject_groups[subject2];
          } else if (subject_groups[subject1].length > 0) {
            const student1 = subject_groups[subject1].shift();
            bench = [student1];
            const idx1 = student_queue.findIndex(s => s.roll_no === student1.roll_no);
            if (idx1 > -1) student_queue.splice(idx1, 1);
            students_allocated += 1;
            if (subject_groups[subject1].length === 0) delete subject_groups[subject1];
          }
        } else if (subject_keys.length === 1) {
          const subject = subject_keys[0];
          if (subject_groups[subject].length > 0) {
            const student1 = subject_groups[subject].shift();
            bench = [student1];
            const idx1 = student_queue.findIndex(s => s.roll_no === student1.roll_no);
            if (idx1 > -1) student_queue.splice(idx1, 1);
            students_allocated += 1;
            if (subject_groups[subject].length === 0) delete subject_groups[subject];
          }
        }
        
        row_data.push(bench);
        
        if (students_allocated >= capacity || student_queue.length === 0) {
          break;
        }
      }
      
      room_allocation.grid.push(row_data);
      
      if (students_allocated >= capacity || student_queue.length === 0) {
        break;
      }
    }
    
    allocations.push(room_allocation);
    
    if (student_queue.length === 0) {
      break;
    }
  }
  
  return {
    allocations,
    unallocated_students: student_queue
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const allBranches = await db.select().from(branches);
    const allSubjects = await db.select().from(subjects);
    const branch_names: { [key: string]: string } = {};
    const subject_names: { [key: string]: string } = {};
    
    allBranches.forEach(b => { branch_names[b.id] = b.branch_name; });
    allSubjects.forEach(s => { subject_names[s.id] = s.name; });
    
    const students_data = body.students.map((student: any) => ({
      roll_no: student.roll_no,
      name: student.roll_no,
      branch: student.branch,
      branch_name: branch_names[student.branch] || student.branch,
      subject: student.subject,
      subject_name: subject_names[student.subject] || student.subject,
      semester: null
    }));
    
    const rooms_data = body.rooms.map((room: any) => ({
      room_id: room.room_id,
      rows: room.rows,
      cols: room.cols
    }));
    
    const allocation_result = allocateStudentsToRooms(students_data, rooms_data);
    
    const [plan] = await db.insert(seatingPlans).values({
      name: body.name,
      exam_date: body.exam_date || null,
      description: body.description || null,
      allocation_data: JSON.stringify(allocation_result),
      total_students: students_data.length,
      total_rooms: rooms_data.length,
      data_source: 'imported',
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    
    return NextResponse.json({
      ...plan,
      allocation_data: allocation_result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

