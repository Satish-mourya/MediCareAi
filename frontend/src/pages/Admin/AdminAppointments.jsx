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
  confirmed: 'bg-teal-50 text-teal-700',
  pending_payment: 'bg-amber-400/15 text-amber-500',
  completed: 'bg-teal-700 text-white',
  cancelled: 'bg-coral-50 text-coral-600',
  no_show: 'bg-ink/10 text-ink/60',
};

export default function AdminAppointments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [appointments, setAppointments] = useState(null);

  useEffect(() => {
    setAppointments(null);
    api
      .get('/admin/appointments', { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setAppointments(data.data.appointments))
      .catch(() => setAppointments([]));
  }, [statusFilter]);

  return (
    <DashboardLayout links={links} title="All Appointments">
      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'confirmed', 'completed', 'cancelled', 'pending_payment'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${statusFilter === s ? 'bg-teal-700 text-white' : 'bg-card text-ink/60'}`}
          >
            {(s || 'all').replace('_', ' ')}
          </button>
        ))}
      </div>

      {appointments === null ? (
        <RowSkeleton count={8} />
      ) : appointments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No appointments found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink/50">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-b border-border last:border-0">
                  <td className="p-4 text-ink/70">{a.patient?.name}</td>
                  <td className="p-4 text-ink/70">Dr. {a.doctor?.user?.name}</td>
                  <td className="p-4 text-ink/70">{format(new Date(a.date), 'MMM d, yyyy')} &middot; {a.startTime}</td>
                  <td className="p-4"><span className={`badge ${statusStyles[a.status]}`}>{a.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
