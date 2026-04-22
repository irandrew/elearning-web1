import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, Enrollment, Module, SystemLog } from '../types';

const COURSES_COLLECTION = 'courses';
const ENROLLMENTS_COLLECTION = 'enrollments';
const LOGS_COLLECTION = 'system_logs';

export const LogService = {
  async log(type: SystemLog['type'], component: string, message: string) {
    try {
      const logRef = doc(collection(db, LOGS_COLLECTION));
      await setDoc(logRef, {
        id: logRef.id,
        type,
        component,
        message,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to write system log:', e);
    }
  },
  async getLogs() {
    const q = query(collection(db, LOGS_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SystemLog);
  }
};

export const CourseService = {
  // --- Course Operations ---
  async createCourse(course: Omit<Course, 'id' | 'enrolledStudents' | 'createdAt'>) {
    const courseRef = doc(collection(db, COURSES_COLLECTION));
    const newCourse: Course = {
      ...course,
      id: courseRef.id,
      enrolledStudents: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(courseRef, newCourse);
    return newCourse;
  },

  async getAllCourses() {
    const q = query(collection(db, COURSES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Course);
  },

  async getCourseById(id: string) {
    const docRef = doc(db, COURSES_COLLECTION, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Course) : null;
  },

  // --- Enrollment Operations ---
  async enrollStudent(userId: string, courseId: string, details?: any) {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    
    // Check if already enrolled
    const snap = await getDoc(enrollmentRef);
    if (snap.exists()) return snap.data() as Enrollment;

    const newEnrollment: Enrollment = {
      id: enrollmentId,
      userId,
      courseId,
      progress: 0,
      completedModuleIds: [],
      enrolledAt: serverTimestamp(),
      lastAccessed: serverTimestamp(),
      registrationDetails: details || null
    };

    await setDoc(enrollmentRef, newEnrollment);
    
    // Increment course enrollment count
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseRef, {
      enrolledStudents: increment(1)
    });

    return newEnrollment;
  },

  async getUserEnrollments(userId: string) {
    const q = query(collection(db, ENROLLMENTS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrollment);
  },

  async getLecturerEnrollments(lecturerId: string) {
    // 1. Get all courses by this lecturer
    const cq = query(collection(db, COURSES_COLLECTION), where('lecturerId', '==', lecturerId));
    const cSnap = await getDocs(cq);
    const courseIds = cSnap.docs.map(doc => doc.id);
    
    if (courseIds.length === 0) return [];

    // 2. Get all enrollments for those courses
    // Firestore 'in' query supports up to 30 values, but for a start this is fine.
    // If more, we'd need to batch or query differently.
    const eq = query(collection(db, ENROLLMENTS_COLLECTION), where('courseId', 'in', courseIds));
    const eSnap = await getDocs(eq);
    return eSnap.docs.map(doc => doc.data() as Enrollment);
  },

  async updateProgress(userId: string, courseId: string, moduleId: string, totalModules: number) {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    
    const snap = await getDoc(enrollmentRef);
    if (!snap.exists()) return;
    
    const data = snap.data() as Enrollment;
    if (data.completedModuleIds.includes(moduleId)) return;

    const newCompleted = [...data.completedModuleIds, moduleId];
    const newProgress = Math.round((newCompleted.length / totalModules) * 100);

    await updateDoc(enrollmentRef, {
      completedModuleIds: newCompleted,
      progress: newProgress,
      lastAccessed: serverTimestamp()
    });
  },

  async updateCourseModules(courseId: string, modules: Module[]) {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(courseRef, { modules });
  }
};
