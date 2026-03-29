export type UserRole = 'admin' | 'faculty';

export interface User {
  username: string;
  role: UserRole;
  name: string;
  picture?: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  totalFee: number;
  photo?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  dateOfAdmission?: string;
  aadharNumber?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  mode: 'cash' | 'online';
  date: string;
  receiptNumber: string;
}

export interface Subject {
  name: string;
  maxMarks: number;
  obtainedMarks: number;
}

export function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'Fail';
}

export function generateReceiptNumber(): string {
  const prefix = 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
