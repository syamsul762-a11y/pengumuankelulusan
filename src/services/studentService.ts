import { Student } from '../types';
import { googleSheetsService } from './googleSheetsService';

export const studentService = {
  async getByNisn(nisn: string): Promise<Student | null> {
    try {
      let values = await googleSheetsService.getValues('Students!A2:H');
      
      // Fallback for public access if no token
      if (!values) {
        const id = await googleSheetsService.getSpreadsheetId();
        if (id) {
          values = await googleSheetsService.getPublicValues(id, 'Students');
          // Gviz returns headers in row 0 sometimes depending on the query, 
          // but our getPublicValues tries to map it.
          // Adjust if index 0 is NISN
          if (values && values[0][0] === 'NISN') values = values.slice(1);
        }
      }

      if (!values) return null;

      const row = values.find(r => r[0] === nisn);
      if (row) {
        return this._mapRowToStudent(row);
      }
      return null;
    } catch (error) {
      console.error('Error fetching student by NISN:', error);
      return null;
    }
  },

  async getAll(): Promise<Student[]> {
    try {
      let values = await googleSheetsService.getValues('Students!A2:H');
      
      // Fallback for public
      if (!values) {
        const id = await googleSheetsService.getSpreadsheetId();
        if (id) {
          values = await googleSheetsService.getPublicValues(id, 'Students');
          if (values && values[0][0] === 'NISN') values = values.slice(1);
        }
      }

      if (!values) return [];
      return values.map(row => this._mapRowToStudent(row));
    } catch (error) {
      console.error('Error fetching all students:', error);
      return [];
    }
  },

  async upsertStudent(student: Student): Promise<void> {
    try {
      const id = await googleSheetsService.getSpreadsheetId();
      if (!id) throw new Error('Spreadsheet ID not found');

      const values = await googleSheetsService.getValues('Students!A2:A');
      const nisnList = values?.map(r => String(r[0])) || [];
      const index = nisnList.indexOf(String(student.nisn));

      const rowData = [
        student.nisn,
        student.name,
        student.class,
        student.birthInfo || '',
        student.status,
        student.averageScore || '',
        student.message || '',
        student.keterangan || '',
        student.bantuanProgram || '',
        student.linkBerkas || '',
        new Date().toISOString()
      ];

      if (index !== -1) {
        // Update existing row (index is 0-based from row 2, so A(index+2))
        await googleSheetsService.updateRange(id, `Students!A${index + 2}:K${index + 2}`, [rowData]);
      } else {
        // Append new row
        await googleSheetsService.appendValues('Students!A2', [rowData]);
      }
    } catch (error) {
      console.error('Error upserting student:', error);
      throw error; // Re-throw so UI can handle it
    }
  },

  async deleteStudent(nisn: string): Promise<void> {
    try {
      const values = await googleSheetsService.getValues('Students!A2:K');
      if (!values) return;

      const filtered = values.filter(row => String(row[0]) !== String(nisn));
      const id = await googleSheetsService.getSpreadsheetId();
      if (id) {
        // Clear entire range first
        await googleSheetsService.updateRange(id, 'Students!A2:K1000', Array(values.length).fill(Array(11).fill('')));
        // Write back filtered
        if (filtered.length > 0) {
          await googleSheetsService.updateRange(id, 'Students!A2', filtered);
        }
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  async importStudents(students: Student[]): Promise<number> {
    let successCount = 0;
    const rows = students.map(student => [
      student.nisn,
      student.name,
      student.class,
      student.birthInfo || '',
      student.status,
      student.averageScore || '',
      student.message || '',
      student.keterangan || '',
      student.bantuanProgram || '',
      student.linkBerkas || '',
      new Date().toISOString()
    ]);

    try {
      await googleSheetsService.appendValues('Students!A2', rows);
      successCount = students.length;
    } catch (error) {
      console.error('Error importing students:', error);
    }
    return successCount;
  },

  _mapRowToStudent(row: any[]): Student {
    return {
      nisn: String(row[0] || ''),
      name: String(row[1] || ''),
      class: String(row[2] || ''),
      birthInfo: String(row[3] || ''),
      status: row[4] === 'LULUS' ? 'LULUS' : 'TIDAK LULUS',
      averageScore: row[5] ? parseFloat(row[5]) : undefined,
      message: String(row[6] || ''),
      keterangan: String(row[7] || ''),
      bantuanProgram: String(row[8] || ''),
      linkBerkas: String(row[9] || ''),
      updatedAt: String(row[10] || '')
    };
  }
};
