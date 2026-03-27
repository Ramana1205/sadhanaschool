import { useState, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { paymentsApi } from '@/lib/api';

export default function Payments() {
  const { students } = useStudentStore();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');

  // 🔥 Get full student object using _id
  const selectedStudent = students.find(
    (s) => s._id === selectedStudentId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    try {
      await paymentsApi.create({
        studentId: selectedStudent._id, // ✅ FIXED
        amount: Number(amount),
        mode,
        date: new Date().toISOString(),
      });

      alert('Payment added successfully');

      // reset form
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

        {/* STUDENT SELECT */}
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.rollNumber})
            </option>
          ))}
        </select>

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
          onChange={(e) => setMode(e.target.value)}
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
    </div>
  );
}