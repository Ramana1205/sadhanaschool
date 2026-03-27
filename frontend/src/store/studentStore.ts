import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student, Payment } from '@/types';
import { generateReceiptNumber } from '@/types';

interface StudentState {
  students: Student[];
  payments: Payment[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => void;
  getStudentPayments: (studentId: string) => Payment[];
  getTotalPaid: (studentId: string) => number;
  getRemainingDue: (studentId: string) => number;
  getTotalFeesCollected: () => number;
  getTotalPendingFees: () => number;
  getClassDistribution: () => { className: string; count: number }[];
}

const SAMPLE_STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Sharma', class: 'Nursery', section: 'A', rollNumber: '001', contactNumber: '9876543210', address: '123 Main Street, New Delhi', totalFee: 30000, createdAt: '2024-04-01' },
  { id: '2', name: 'Priya Patel', class: 'Nursery', section: 'A', rollNumber: '002', contactNumber: '9876543211', address: '456 Park Road, Mumbai', totalFee: 30000, createdAt: '2024-04-01' },
  { id: '3', name: 'Rohan Kumar', class: 'LKG', section: 'A', rollNumber: '001', contactNumber: '9876543212', address: '789 Oak Avenue, Bangalore', totalFee: 32000, createdAt: '2024-04-01' },
  { id: '4', name: 'Ananya Singh', class: 'LKG', section: 'B', rollNumber: '002', contactNumber: '9876543213', address: '321 Elm Street, Chennai', totalFee: 32000, createdAt: '2024-04-01' },
  { id: '5', name: 'Vikram Reddy', class: 'UKG', section: 'A', rollNumber: '001', contactNumber: '9876543214', address: '654 Pine Lane, Hyderabad', totalFee: 34000, createdAt: '2024-04-01' },
  { id: '6', name: 'Sanya Gupta', class: '1st', section: 'A', rollNumber: '001', contactNumber: '9876543215', address: '111 Rose St, Pune', totalFee: 36000, createdAt: '2024-04-01' },
  { id: '7', name: 'Arjun Nair', class: '2nd', section: 'A', rollNumber: '001', contactNumber: '9876543216', address: '222 Lily Rd, Kochi', totalFee: 38000, createdAt: '2024-04-01' },
  { id: '8', name: 'Meera Joshi', class: '3rd', section: 'A', rollNumber: '001', contactNumber: '9876543217', address: '333 Tulip Ave, Jaipur', totalFee: 40000, createdAt: '2024-04-01' },
  { id: '9', name: 'Kabir Verma', class: '5th', section: 'A', rollNumber: '001', contactNumber: '9876543218', address: '444 Jasmine Ln, Lucknow', totalFee: 42000, createdAt: '2024-04-01' },
  { id: '10', name: 'Diya Chauhan', class: '8th', section: 'A', rollNumber: '001', contactNumber: '9876543219', address: '555 Orchid Blvd, Ahmedabad', totalFee: 45000, createdAt: '2024-04-01' },
  { id: '11', name: 'Ishaan Malhotra', class: '10th', section: 'A', rollNumber: '001', contactNumber: '9876543220', address: '666 Lotus Dr, Chandigarh', totalFee: 50000, createdAt: '2024-04-01' },
  { id: '12', name: 'Kavya Rao', class: '10th', section: 'B', rollNumber: '002', contactNumber: '9876543221', address: '777 Marigold Way, Mysore', totalFee: 50000, createdAt: '2024-04-01' },
];

const SAMPLE_PAYMENTS: Payment[] = [
  { id: 'p1', studentId: '1', amount: 15000, mode: 'online', date: '2024-06-15', receiptNumber: 'RCP-001' },
  { id: 'p2', studentId: '2', amount: 30000, mode: 'cash', date: '2024-06-20', receiptNumber: 'RCP-002' },
  { id: 'p3', studentId: '3', amount: 20000, mode: 'online', date: '2024-07-01', receiptNumber: 'RCP-003' },
  { id: 'p4', studentId: '6', amount: 36000, mode: 'cash', date: '2024-08-10', receiptNumber: 'RCP-004' },
  { id: 'p5', studentId: '11', amount: 25000, mode: 'online', date: '2024-09-01', receiptNumber: 'RCP-005' },
];

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      students: SAMPLE_STUDENTS,
      payments: SAMPLE_PAYMENTS,
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
      addPayment: (payment) => {
        const newPayment: Payment = {
          ...payment,
          id: Date.now().toString(),
          receiptNumber: generateReceiptNumber(),
        };
        set((state) => ({ payments: [...state.payments, newPayment] }));
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
    }),
    { name: 'student-storage' }
  )
);
