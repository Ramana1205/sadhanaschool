import { useStudentStore } from '@/store/studentStore';
import { Users, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { students, payments, getTotalFeesCollected, getTotalPendingFees, getClassDistribution } = useStudentStore();
  const totalCollected = getTotalFeesCollected();
  const totalPending = getTotalPendingFees();
  const recentPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const classDistribution = getClassDistribution();

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'bg-primary' },
    { label: 'Fees Collected', value: `₹${totalCollected.toLocaleString()}`, icon: TrendingUp, color: 'bg-success' },
    { label: 'Pending Fees', value: `₹${totalPending.toLocaleString()}`, icon: AlertCircle, color: 'bg-warning' },
    { label: 'Total Payments', value: payments.length, icon: CreditCard, color: 'bg-info' },
  ];

  const COLORS = ['hsl(220,70%,25%)', 'hsl(38,92%,50%)', 'hsl(152,60%,40%)', 'hsl(210,80%,55%)', 'hsl(0,72%,51%)', 'hsl(280,60%,50%)', 'hsl(170,60%,40%)', 'hsl(30,80%,50%)', 'hsl(200,70%,45%)', 'hsl(340,70%,50%)', 'hsl(100,50%,40%)', 'hsl(260,50%,55%)', 'hsl(20,90%,55%)'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of Sadhana Memorial School</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-start gap-4">
            <div className={`${stat.color} h-11 w-11 rounded-lg flex items-center justify-center shrink-0`}>
              <stat.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground font-display">Students by Class</h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {classDistribution.map((item) => (
                <div key={item.className} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{item.className}</span>
                  <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-0.5 rounded-full">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground font-display">Class Distribution</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(0,0%,100%)', border: '1px solid hsl(214,20%,90%)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {classDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground font-display">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Receipt #</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Mode</th>
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => {
                const student = students.find((s) => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs">{payment.receiptNumber}</td>
                    <td className="px-6 py-3 font-medium">{student?.name || 'Unknown'}</td>
                    <td className="px-6 py-3 text-success font-medium">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.mode === 'online' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                      }`}>{payment.mode}</span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{payment.date}</td>
                  </tr>
                );
              })}
              {recentPayments.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
