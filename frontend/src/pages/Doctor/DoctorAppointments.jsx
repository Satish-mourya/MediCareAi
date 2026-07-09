import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctor/slots', label: 'Manage Slots', icon: Clock3 },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle2 },
];

const statusStyles = {
  confirmed: 'bg-teal-50 text-teal-700',
  pending_payment: 'bg-amber-400/15 text-amber-500',
  completed: 'bg-teal-700 text-white',
  cancelled: 'bg-coral-50 text-coral-600',
  no_show: 'bg-ink/10 text-ink/60',
};

export default function DoctorAppointments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [appointments, setAppointments] = useState(null);

  useEffect(() => {
    setAppointments(null);
    api
      .get('/appointments/doctor', { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setAppointments(data.data.appointments))
      .catch(() => setAppointments([]));
  }, [statusFilter]);

  return (
    <DashboardLayout links={links} title="Appointments">
      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              statusFilter === s ? 'bg-teal-700 text-white' : 'bg-card text-ink/60'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {appointments === null ? (
        <RowSkeleton count={6} />
      ) : appointments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No appointments found.</div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Link
              key={a._id}
              to={`/doctor/appointments/${a._id}`}
              className="card flex flex-col gap-2 p-5 transition hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                  {a.patient?.name?.[0]}
                </div>
                <div>
                  <p className="font-medium text-ink">{a.patient?.name}</p>
                  <p className="text-xs text-ink/50">
                    {format(new Date(a.date), 'MMM d, yyyy')} &middot; {a.startTime} - {a.endTime}
                  </p>
                </div>
              </div>
              <span className={`badge w-fit ${statusStyles[a.status]}`}>{a.status.replace('_', ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
