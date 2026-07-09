import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarClock, CreditCard, UserCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/patient/dashboard', label: 'Symptom Checker', icon: LayoutDashboard, end: true },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/patient/payments', label: 'Payments', icon: CreditCard },
  { to: '/patient/profile', label: 'Profile', icon: UserCircle },
];

const statusStyles = {
  succeeded: 'bg-teal-50 text-teal-700',
  created: 'bg-amber-400/15 text-amber-500',
  failed: 'bg-coral-50 text-coral-600',
  refunded: 'bg-ink/10 text-ink/60',
};

export default function PatientPayments() {
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    api.get('/payments/my').then(({ data }) => setPayments(data.data.payments));
  }, []);

  return (
    <DashboardLayout links={links} title="Payment History">
      {payments === null ? (
        <RowSkeleton count={5} />
      ) : payments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No payments yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink/50">
              <tr>
                <th className="p-4">Doctor</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium text-ink">Dr. {p.doctor?.user?.name}</td>
                  <td className="p-4 text-ink/60">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                  <td className="p-4 font-semibold text-ink">₹{p.amount}</td>
                  <td className="p-4">
                    <span className={`badge ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
