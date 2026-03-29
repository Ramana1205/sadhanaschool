import { create } from 'zustand';
import type { Student, Payment } from '@/types';
import { generateReceiptNumber } from '@/types';
import { studentsApi, paymentsApi } from '@/lib/api';

interface StudentState {
  students: Student[];
  payments: Payment[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'> & Partial<Pick<Payment, 'id' | 'receiptNumber'>>) => void;
  loadStudents: () => Promise<void>;
  loadPayments: () => Promise<void>;
  getStudentPayments: (studentId: string) => Payment[];
  getTotalPaid: (studentId: string) => number;
  getRemainingDue: (studentId: string) => number;
  getTotalFeesCollected: () => number;
  getTotalPendingFees: () => number;
  getClassDistribution: () => { className: string; count: number }[];
}

type PaymentInput = Omit<Payment, 'id'> & Partial<Pick<Payment, 'id' | 'receiptNumber'>>;

const normalizeStudent = (student: any): Student => ({
  id: student._id || student.id || Date.now().toString(),
  name: student.name || '',
  class: student.class || '',
  section: student.section || '',
  rollNumber: student.rollNumber || '',
  contactNumber: student.contactNumber || '',
  address: student.address || '',
  totalFee: Number(student.totalFee || 0),
  photo: student.photo,
  admissionNumber: student.admissionNumber || undefined,
  dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : undefined,
  fatherName: student.fatherName || undefined,
  motherName: student.motherName || undefined,
  dateOfAdmission: student.dateOfAdmission ? new Date(student.dateOfAdmission).toISOString().split('T')[0] : undefined,
  aadharNumber: student.aadharNumber || undefined,
  createdAt: student.createdAt || new Date().toISOString().split('T')[0],
});

const normalizePayment = (payment: any): Payment => ({
  id: payment._id || payment.id || Date.now().toString(),
  studentId: typeof payment.studentId === 'object' ? payment.studentId._id : payment.studentId,
  amount: Number(payment.amount || 0),
  mode: payment.mode === 'online' ? 'online' : 'cash',
  date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  receiptNumber: payment.receiptNumber || generateReceiptNumber(),
});

export const useStudentStore = create<StudentState>()((set, get) => ({
  students: [],
  payments: [],
  addStudent: (student) => {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ students: [...state.students, newStudent] }));
  },
  updateStudent: (id, data) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  },
  deleteStudent: (id) => {
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      payments: state.payments.filter((p) => p.studentId !== id),
    }));
  },
  addPayment: (payment: PaymentInput) => {
    const newPayment: Payment = {
      ...payment,
      id: payment.id || Date.now().toString(),
      receiptNumber: payment.receiptNumber || generateReceiptNumber(),
    } as Payment;
    set((state) => ({ payments: [...state.payments, newPayment] }));
  },
  loadStudents: async () => {
    try {
      const data = (await studentsApi.getAll()) as any[];
      const mapped = data.map(normalizeStudent);
      set({ students: mapped });
    } catch (error) {
      console.error('Failed to load students', error);
    }
  },
  loadPayments: async () => {
    try {
      const data = (await paymentsApi.getAll()) as any[];
      const mapped = data.map(normalizePayment);
      set({ payments: mapped });
    } catch (error) {
      console.error('Failed to load payments', error);
    }
  },
  getStudentPayments: (studentId) => get().payments.filter((p) => p.studentId === studentId),
  getTotalPaid: (studentId) =>
    get().payments.filter((p) => p.studentId === studentId).reduce((sum, p) => sum + p.amount, 0),
  getRemainingDue: (studentId) => {
    const student = get().students.find((s) => s.id === studentId);
    if (!student) return 0;
    return student.totalFee - get().getTotalPaid(studentId);
  },
  getTotalFeesCollected: () => get().payments.reduce((sum, p) => sum + p.amount, 0),
  getTotalPendingFees: () => {
    const state = get();
    return state.students.reduce((sum, s) => {
      const paid = state.payments.filter((p) => p.studentId === s.id).reduce((a, p) => a + p.amount, 0);
      return sum + (s.totalFee - paid);
    }, 0);
  },
  getClassDistribution: () => {
    const state = get();
    const classMap = new Map<string, number>();
    state.students.forEach((s) => {
      classMap.set(s.class, (classMap.get(s.class) || 0) + 1);
    });
    const order = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return order
      .filter((c) => classMap.has(c))
      .map((c) => ({ className: c, count: classMap.get(c)! }));
  },
}));
