import { useState, useRef } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
// logo file placed in public folder
// use jpg if available, otherwise png fallback
const logoUrl = '/logo.jpg';
import StudentFilter from '@/components/StudentFilter';

export default function Receipt() {
  const { students, payments, getTotalPaid, getRemainingDue } = useStudentStore();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const studentPayments = payments.filter((p) => p.studentId === selectedStudent);
  const payment = payments.find((p) => p.id === selectedPayment);
  const student = payment ? students.find((s) => s.id === payment.studentId) : null;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Payment Receipt</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and print payment receipts</p>
        </div>
      </div>

      <div className="no-print">
        <StudentFilter selectedStudent={selectedStudent} onSelectStudent={(id) => { setSelectedStudent(id); setSelectedPayment(''); }} label="Select Student" />
      </div>

      {selectedStudent && studentPayments.length > 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print">
          <Label className="mb-2 block">Select Payment</Label>
          <Select value={selectedPayment} onValueChange={setSelectedPayment}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a payment to generate receipt" />
            </SelectTrigger>
            <SelectContent>
              {studentPayments.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.receiptNumber} — ₹{p.amount.toLocaleString()} — {p.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedStudent && studentPayments.length === 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print text-center text-muted-foreground">
          No payments found for this student.
        </div>
      )}

      {payment && student && (
        <>
          <div className="flex justify-end no-print">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
          </div>

          <div ref={printRef} className="print-container bg-card rounded-xl shadow-[var(--shadow-card)] p-8 max-w-2xl mx-auto relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <img
                src={logoUrl}
                alt="Watermark"
                className="h-96 w-96 object-contain"
                style={{ WebkitPrintColorAdjust: 'exact' }}
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-3">
                <img
                  src={logoUrl}
                  alt="School Logo"
                  className="h-9 w-9 object-contain"
                  style={{ WebkitPrintColorAdjust: 'exact' }}
                />
              </div>
              <h1 className="text-2xl font-bold font-display text-foreground">Sadhana Memorial School</h1>
              <p className="text-sm text-muted-foreground">123 Education Lane, Knowledge City — Phone: (555) 123-4567</p>
              <div className="mt-4 h-1 w-32 mx-auto bg-primary rounded-full" />
            </div>

            <h2 className="text-center text-lg font-semibold mb-6 text-foreground">PAYMENT RECEIPT</h2>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm relative z-10">
              <div>
                <p className="text-muted-foreground">Receipt Number</p>
                <p className="font-semibold font-mono">{payment.receiptNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">{payment.date}</p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 mb-6 space-y-3 text-sm relative z-10">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student Name</span>
                <span className="font-semibold">{student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class & Section</span>
                <span className="font-semibold">{student.class}-{student.section}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roll Number</span>
                <span className="font-semibold">{student.rollNumber}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 mb-6 relative z-10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-lg text-success">₹{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="font-semibold capitalize">{payment.mode}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Due</span>
                <span className="font-semibold text-destructive">₹{getRemainingDue(student.id).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-12 flex justify-between items-end text-sm relative z-10">
              <div>
                <p className="text-muted-foreground text-xs">This is a computer-generated receipt.</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-t border-foreground pt-2">
                  <img src="/sign.jpeg" alt="Signature" className="mx-auto h-12 object-contain" style={{ WebkitPrintColorAdjust: 'exact' }} />
                  <p className="font-medium mt-1">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
