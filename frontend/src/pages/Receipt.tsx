import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { useStudentStore } from '@/store/studentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
// logo file placed in public folder
// use jpg if available, otherwise png fallback
const logoUrl = '/logo.png';
import StudentFilter from '@/components/StudentFilter';

export default function Receipt() {
  const { students, payments, loadStudents, loadPayments } = useStudentStore();
  const [searchParams] = useSearchParams();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [printAll, setPrintAll] = useState(false);
  const [printStatement, setPrintStatement] = useState(false);
  const [printSelected, setPrintSelected] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const studentId = searchParams.get('studentId');
    const paymentId = searchParams.get('paymentId');
    if (studentId) setSelectedStudent(studentId);
    if (paymentId) setSelectedPayment(paymentId);

    (async () => {
      await loadStudents();
      await loadPayments();
    })();
  }, [searchParams, loadStudents, loadPayments]);

  const studentPayments = payments.filter((p) => p.studentId === selectedStudent);
  const payment = payments.find((p) => p.id === selectedPayment);
  const student = selectedStudent ? students.find((s) => s.id === selectedStudent) : null;

  const getSortedPayments = () => {
    return [...studentPayments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getHistoricalBalanceByIndex = (paymentIndex: number, sortedPayments: any[]) => {
    if (!student) return 0;
    const totalPaidAll = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const initialDue = student.totalBalance + totalPaidAll;
    const paymentsUpToIndex = sortedPayments.slice(0, paymentIndex + 1);
    const totalPaid = paymentsUpToIndex.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, initialDue - totalPaid);
  };

  const getHistoricalBalance = (paymentDate: string) => {
    if (!student) return 0;
    const totalPaidAll = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const initialDue = student.totalBalance + totalPaidAll;
    const paymentsUpToDate = studentPayments.filter((p) => new Date(p.date) <= new Date(paymentDate));
    const totalPaid = paymentsUpToDate.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, initialDue - totalPaid);
  };

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
                  {p.receiptNumber} — ₹{p.amount.toLocaleString()} — {formatDate(p.date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 flex gap-2 flex-wrap">
            {selectedPayment && (
              <Button onClick={() => { setPrintSelected(true); setPrintAll(false); setPrintStatement(false); setTimeout(() => window.print(), 100); }} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" /> Print Selected Receipt
              </Button>
            )}
            {studentPayments.length > 1 && (
              <Button onClick={() => { setPrintAll(true); setPrintSelected(false); setPrintStatement(false); setTimeout(() => window.print(), 100); }} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" /> Print All Receipts
              </Button>
            )}
            {studentPayments.length > 0 && (
              <Button onClick={() => { setPrintStatement(true); setPrintAll(false); setPrintSelected(false); setTimeout(() => window.print(), 100); }} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" /> Print Statement
              </Button>
            )}
          </div>
        </div>
      )}

      {selectedStudent && studentPayments.length === 0 && (
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-6 no-print text-center text-muted-foreground">
          No payments found for this student.
        </div>
      )}

      {student && (
        <>
          <div className="flex justify-end no-print gap-2 flex-wrap">
            {!printAll && !printStatement && !printSelected && selectedPayment && payment && (
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            )}
          </div>

          <div ref={printRef}>
            {printStatement && (
              <div className="print-container bg-card rounded-xl shadow-[var(--shadow-card)] p-8 max-w-4xl mx-auto relative overflow-hidden">
                <h2 className="text-center text-2xl font-bold mb-6">Payment Statement</h2>
                <p className="text-sm text-muted-foreground mb-4">Student: {student?.name} ({student?.class}-{student?.section})</p>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">#</th>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Receipt No</th>
                      <th className="border p-2 text-right">Amount Paid</th>
                      <th className="border p-2 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPayments().map((p, index) => (
                        <tr key={p.id}>
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">{formatDate(p.date)}</td>
                          <td className="border p-2">{p.receiptNumber}</td>
                          <td className="border p-2 text-right">₹{p.amount.toLocaleString()}</td>
                          <td className="border p-2 text-right">₹{getHistoricalBalanceByIndex(index, getSortedPayments()).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="mt-6 text-right">
                  <p className="font-semibold">Total Paid: ₹{studentPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                  <p className="font-semibold">Remaining Due: ₹{student?.totalBalance.toLocaleString()}</p>
                </div>
              </div>
            )}
            {printAll && (
              getSortedPayments().map((p, index) => (
                  <div key={p.id} className={`print-container bg-card rounded-xl shadow-[var(--shadow-card)] p-8 max-w-2xl mx-auto relative overflow-hidden ${index > 0 ? 'page-break' : ''}`}>
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
                      <img
                        src={logoUrl}
                        alt="School Logo"
                        className="mx-auto mb-4 h-16 w-auto object-contain"
                        style={{ WebkitPrintColorAdjust: 'exact' }}
                      />
                      <h1 className="text-2xl font-bold font-display text-foreground">SADHANA MEMORIAL SCHOOL</h1>
                      <p className="text-sm text-muted-foreground">Sanjay Gandhi Nagar, Shapur — Phone: 9848623438</p>
                      <div className="mt-4 h-1 w-32 mx-auto bg-primary rounded-full" />
                    </div>

                    <h2 className="text-center text-lg font-semibold mb-6 text-foreground">PAYMENT RECEIPT</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm relative z-10">
                      <div>
                        <p className="text-muted-foreground">Receipt Number</p>
                        <p className="font-semibold font-mono">{p.receiptNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-semibold">{formatDate(p.date)}</p>
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
                        <span className="font-bold text-lg text-success">₹{p.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Payment Mode</span>
                        <span className="font-semibold capitalize">{p.mode}</span>
                      </div>
                      <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining Due</span>
                        <span className="font-semibold text-destructive">₹{getHistoricalBalanceByIndex(index, getSortedPayments()).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-between items-end text-sm relative z-10">
                      <div>
                        <p className="text-muted-foreground text-xs">This is a computer-generated receipt.</p>
                      </div>
                      <div className="text-center">
                        <div className="w-40 pt-2">
                          <img src="/sign.jpeg" alt="Signature" className="mx-auto h-12 object-contain" style={{ WebkitPrintColorAdjust: 'exact' }} />
                          <p className="font-medium mt-1">Authorized Signature</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {printSelected && payment && (() => {
              const sortedPayments = getSortedPayments();
              const paymentIndex = sortedPayments.findIndex(p => p.id === payment.id);
              return (
                <div className="print-container bg-card rounded-xl shadow-[var(--shadow-card)] p-8 max-w-2xl mx-auto relative overflow-hidden">
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
                    <img
                      src={logoUrl}
                      alt="School Logo"
                      className="mx-auto mb-4 h-16 w-auto object-contain"
                      style={{ WebkitPrintColorAdjust: 'exact' }}
                    />
                    <h1 className="text-2xl font-bold font-display text-foreground">SADHANA MEMORIAL SCHOOL</h1>
                    <p className="text-sm text-muted-foreground">Sanjay Gandhi Nagar, Shapur — Phone: 9848623438</p>
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
                      <p className="font-semibold">{formatDate(payment.date)}</p>
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
                      <span className="font-semibold text-destructive">₹{getHistoricalBalanceByIndex(paymentIndex, sortedPayments).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-between items-end text-sm relative z-10">
                    <div>
                      <p className="text-muted-foreground text-xs">This is a computer-generated receipt.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-40 pt-2">
                        <img src="/sign.jpeg" alt="Signature" className="mx-auto h-12 object-contain" style={{ WebkitPrintColorAdjust: 'exact' }} />
                        <p className="font-medium mt-1">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
