import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentStore } from '@/store/studentStore';
import { paymentsApi, studentsApi } from '@/lib/api';
import StudentFilter from '@/components/StudentFilter';

export default function Payments() {
  const navigate = useNavigate();
  const { students, addPayment } = useStudentStore();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'cash' | 'online'>('cash');
  const [recentPayment, setRecentPayment] = useState<any>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = (await studentsApi.getAll()) as any[];
        const mapped = data.map((s: any) => ({ ...s, id: s._id }));
        useStudentStore.setState({ students: mapped });
      } catch (error) {
        console.error('Failed to load students for payments', error);
      }
    };

    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    try {
      const created = (await paymentsApi.create({
        studentId: selectedStudent.id,
        amount: Number(amount),
        mode,
        date: new Date().toISOString(),
      })) as any;

      // Keep local state in sync for receipts / balance
      addPayment({
        studentId: selectedStudent.id,
        amount: Number(amount),
        mode,
        date: created.date || new Date().toISOString(),
      });

      setRecentPayment(created);
      alert('Payment added successfully');

      setSelectedStudentId('');
      setAmount('');
      setMode('cash');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Payment failed');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Add Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <StudentFilter
          selectedStudent={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          label="Select Student"
        />

        {/* AMOUNT */}
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />

        {/* MODE */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'cash' | 'online')}
          className="w-full p-2 border rounded"
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Submit Payment
        </button>
      </form>

      {recentPayment && (
        <div className="mt-6 p-4 border border-border rounded-lg bg-surface">
          <p className="mb-2 text-sm text-foreground">Payment processed: {recentPayment.receiptNumber || '(new)'}.</p>
          <p className="text-sm text-muted-foreground mb-3">Do you want to print the receipt now?</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => {
                navigate(`/receipt?studentId=${encodeURIComponent(selectedStudentId)}&paymentId=${encodeURIComponent(recentPayment._id || recentPayment.id || '')}`);
              }}
            >
              Print Receipt
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              onClick={() => setRecentPayment(null)}
            >
              No Thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}