import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarClock, CreditCard, UserCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import SymptomChecker from '../../components/patient/SymptomChecker';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const links = [
  { to: '/patient/dashboard', label: 'Symptom Checker', icon: LayoutDashboard, end: true },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/patient/payments', label: 'Payments', icon: CreditCard },
  { to: '/patient/profile', label: 'Profile', icon: UserCircle },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState(null);

  useEffect(() => {
    api
      .get('/appointments/my', { params: { status: 'upcoming' } })
      .then(({ data }) => setUpcoming(data.data.appointments.slice(0, 3)))
      .catch(() => setUpcoming([]));
  }, []);

  return (
    <DashboardLayout links={links} title="Symptom Checker">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Hi {user?.name?.split(' ')[0]}, how are you feeling today?</h2>
        <p className="mt-1 text-sm text-ink/60">
          Describe your symptoms below and we'll suggest the right specialist for you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SymptomChecker />
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">Upcoming Appointments</h3>
              <Link to="/patient/appointments" className="text-xs font-semibold text-teal-700">
                View all
              </Link>
            </div>
            {upcoming === null ? (
              <RowSkeleton count={3} />
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-ink/50">No upcoming appointments yet.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a._id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium text-ink">Dr. {a.doctor?.user?.name}</p>
                    <p className="text-xs text-ink/50">{a.doctor?.specialization}</p>
                    <p className="mt-1 text-xs text-teal-700">
                      {format(new Date(a.date), 'MMM d, yyyy')} &middot; {a.startTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link to="/doctors" className="card flex items-center justify-between p-5 transition hover:shadow-lift">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Browse all doctors</p>
              <p className="text-xs text-ink/50">Search by specialization or name</p>
            </div>
            <ArrowRight className="h-4 w-4 text-teal-700" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
