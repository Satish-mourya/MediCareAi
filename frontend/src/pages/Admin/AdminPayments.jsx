import { useEffect, useState } from 'react';
import { LayoutDashboard, Stethoscope, Users, CalendarClock, CreditCard } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/admin/dashboard', label: 'Analytics', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
];

const statusStyles = {
  succeeded: 'bg-teal-50 text-teal-700',
  created: 'bg-amber-400/15 text-amber-500',
  failed: 'bg-coral-50 text-coral-600',
  refunded: 'bg-ink/10 text-ink/60',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    api.get('/admin/payments').then(({ data }) => setPayments(data.data.payments));
  }, []);

  const totalRevenue = payments?.filter((p) => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout links={links} title="Payments">
      {payments && (
        <div className="card mb-6 flex items-center justify-between p-5">
          <p className="text-sm font-medium text-ink/60">Total revenue collected</p>
          <p className="font-display text-2xl font-bold text-teal-700">₹{totalRevenue?.toLocaleString()}</p>
        </div>
      )}

      {payments === null ? (
        <RowSkeleton count={8} />
      ) : payments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No payments found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink/50">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="p-4 text-ink/70">{p.patient?.name}</td>
                  <td className="p-4 text-ink/70">Dr. {p.doctor?.user?.name}</td>
                  <td className="p-4 font-semibold text-ink">₹{p.amount}</td>
                  <td className="p-4 text-ink/70">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                  <td className="p-4"><span className={`badge ${statusStyles[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
