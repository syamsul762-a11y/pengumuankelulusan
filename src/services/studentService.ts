import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student } from '../types';

const COLLECTION_NAME = 'students';

export const studentService = {
  async getByNisn(nisn: string): Promise<Student | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, nisn);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Student;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${nisn}`);
      return null;
    }
  },

  async getAll(): Promise<Student[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async upsertStudent(student: Student): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, student.nisn);
      const data = {
        ...student,
        updatedAt: serverTimestamp(),
      };
      
      // Remove id if it exists in the data object to avoid duplicating it
      if ('id' in data) delete (data as any).id;
      
      // If it's a new student, add createdAt
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        (data as any).createdAt = serverTimestamp();
      }

      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${student.nisn}`);
    }
  },

  async deleteStudent(nisn: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, nisn));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${nisn}`);
    }
  },

  async importStudents(students: Student[]): Promise<number> {
    let successCount = 0;
    for (const student of students) {
      try {
        await this.upsertStudent(student);
        successCount++;
      } catch (error) {
        console.error(`Failed to import student ${student.nisn}:`, error);
      }
    }
    return successCount;
  }
};
