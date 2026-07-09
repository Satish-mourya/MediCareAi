import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Stethoscope, Users, CalendarClock, CreditCard, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { StatCardSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';

const links = [
  { to: '/admin/dashboard', label: 'Analytics', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
];

const COLORS = ['#146356', '#3FA796', '#E8543E', '#D9922A', '#7CC1B2'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data.data));
  }, []);

  const statCards = data
    ? [
        { label: 'Total Patients', value: data.totals.patients, icon: Users },
        { label: 'Active Doctors', value: data.totals.doctors, icon: Stethoscope },
        { label: 'Total Appointments', value: data.totals.appointments, icon: CalendarClock },
        { label: 'Total Revenue', value: `₹${data.totals.revenue.toLocaleString()}`, icon: TrendingUp },
      ]
    : [];

  return (
    <DashboardLayout links={links} title="Analytics Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data === null
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((s) => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-ink/50">{s.label}</p>
                  <s.icon className="h-4 w-4 text-teal-600" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{s.value}</p>
              </div>
            ))}
      </div>

      {data === null ? (
        <div className="skeleton mt-6 h-80 w-full" />
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-display text-sm font-semibold text-ink">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthlyRevenue.map((m) => ({
                  name: `${m._id.month}/${m._id.year}`,
                  revenue: m.revenue,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E9E6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#146356" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-sm font-semibold text-ink">Most Booked Specializations</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.mostBookedSpecializations.map((s) => ({ name: s._id, value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    {data.mostBookedSpecializations.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-display text-sm font-semibold text-ink">Most Searched Symptoms (by specialization)</h3>
              <div className="mt-4 space-y-2">
                {data.mostSearchedSymptomsSpecializations.map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-sm">
                    <span className="text-ink/70">{s._id}</span>
                    <span className="font-semibold text-ink">{s.count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink/40">Total AI symptom analyses run: {data.totals.aiAnalysesRun}</p>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-sm font-semibold text-ink">Top Performing Doctors</h3>
              <div className="mt-4 space-y-3">
                {data.topPerformingDoctors.map((d) => (
                  <div key={d._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink">Dr. {d.user?.name}</p>
                      <p className="text-xs text-ink/50">{d.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink">{d.totalAppointments} appts</p>
                      <p className="text-xs text-amber-500">★ {d.ratingAverage?.toFixed(1) || 'New'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {data.totals.pendingDoctorApprovals > 0 && (
            <div className="card mt-6 flex items-center justify-between border-amber-400/30 bg-amber-400/10 p-5">
              <p className="text-sm font-medium text-amber-600">
                {data.totals.pendingDoctorApprovals} doctor account(s) awaiting approval
              </p>
              <a href="/admin/doctors" className="btn-primary text-xs">Review now</a>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
