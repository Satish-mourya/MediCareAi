import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { StatCardSkeleton, RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctor/slots', label: 'Manage Slots', icon: Clock3 },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle2 },
];

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [today, setToday] = useState(null);

  useEffect(() => {
    api.get('/doctors/me/profile').then(({ data }) => setProfile(data.data.doctor));
    api
      .get('/appointments/doctor', { params: { date: format(new Date(), 'yyyy-MM-dd') } })
      .then(({ data }) => setToday(data.data.appointments));
  }, []);

  const stats = [
    { label: 'Total Appointments', value: profile?.totalAppointments ?? '—' },
    { label: 'Average Rating', value: profile?.ratingAverage ? profile.ratingAverage.toFixed(1) : 'New' },
    { label: 'Consultation Fee', value: profile ? `₹${profile.consultationFee}` : '—' },
    { label: "Today's Appointments", value: today?.length ?? '—' },
  ];

  return (
    <DashboardLayout links={links} title="Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {profile === null
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-xs font-medium text-ink/50">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{s.value}</p>
              </div>
            ))}
      </div>

      <div className="card mt-6 p-6">
        <h3 className="font-display text-base font-semibold text-ink">Today's Schedule</h3>
        <div className="mt-4">
          {today === null ? (
            <RowSkeleton count={4} />
          ) : today.length === 0 ? (
            <p className="text-sm text-ink/50">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {today.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{a.patient?.name}</p>
                    <p className="text-xs text-ink/50">{a.startTime} - {a.endTime}</p>
                  </div>
                  <span className="badge bg-teal-50 text-teal-700">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
