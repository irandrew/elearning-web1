export type UserRole = 'student' | 'lecturer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: any;
}

export interface Module {
  id: string;
  title: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  code: string; // e.g. CSC311
  lecturerId: string;
  lecturerName: string;
  thumbnail: string;
  modules: Module[];
  enrolledStudents: number;
  createdAt: any;
}

export interface RegistrationDetails {
  studentId: string;
  academicYear: string;
  department: string;
  motivation: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedModuleIds: string[];
  enrolledAt: any;
  lastAccessed: any;
  registrationDetails?: RegistrationDetails;
}

export interface SystemLog {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: any;
}
