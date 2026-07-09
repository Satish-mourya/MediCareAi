import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axios';

const links = [
  { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctor/slots', label: 'Manage Slots', icon: Clock3 },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle2 },
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorProfileEdit() {
  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/doctors/me/profile').then(({ data }) => {
      const d = data.data.doctor;
      setDoctor(d);
      setForm({
        about: d.about || '',
        experienceYears: d.experienceYears,
        consultationFee: d.consultationFee,
        hospitalName: d.hospital?.name || '',
        hospitalCity: d.hospital?.city || '',
        qualifications: (d.qualifications || []).join(', '),
        languages: (d.languages || []).join(', '),
      });
      setSchedule(
        days.map((day) => {
          const existing = d.recurringSchedule?.find((s) => s.day === day);
          return existing || { day, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: false };
        })
      );
    });
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/doctors/me/profile', {
        about: form.about,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        hospital: { name: form.hospitalName, city: form.hospitalCity },
        qualifications: form.qualifications.split(',').map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Profile updated');
    } catch (err) {
      /* handled globally */
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await api.put('/doctors/me/recurring-schedule', { recurringSchedule: schedule });
      toast.success('Recurring schedule saved');
    } catch (err) {
      /* handled globally */
    }
  };

  const updateDay = (idx, field, value) => {
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  if (!form) {
    return (
      <DashboardLayout links={links} title="Profile">
        <div className="skeleton h-96 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links} title="Profile & Schedule">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSaveProfile} className="card space-y-4 p-6">
          <h3 className="font-display text-base font-semibold text-ink">Profile Details</h3>
          <div>
            <label className="label">About</label>
            <textarea className="input-field min-h-[90px] resize-none" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" className="input-field" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
            </div>
            <div>
              <label className="label">Consultation fee (₹)</label>
              <input type="number" className="input-field" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hospital name</label>
              <input className="input-field" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input-field" value={form.hospitalCity} onChange={(e) => setForm({ ...form, hospitalCity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Qualifications (comma-separated)</label>
            <input className="input-field" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
          </div>
          <div>
            <label className="label">Languages (comma-separated)</label>
            <input className="input-field" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-ink">Recurring Weekly Schedule</h3>
          <p className="mt-1 text-xs text-ink/50">Used as a template — you still generate actual bookable slots in "Manage Slots".</p>
          <div className="mt-4 space-y-3">
            {schedule.map((s, idx) => (
              <div key={s.day} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                <label className="flex w-28 items-center gap-2 text-sm font-medium text-ink">
                  <input type="checkbox" checked={s.isActive} onChange={(e) => updateDay(idx, 'isActive', e.target.checked)} />
                  {s.day}
                </label>
                <input type="time" disabled={!s.isActive} className="input-field w-28 py-1.5" value={s.startTime} onChange={(e) => updateDay(idx, 'startTime', e.target.value)} />
                <span className="text-xs text-ink/40">to</span>
                <input type="time" disabled={!s.isActive} className="input-field w-28 py-1.5" value={s.endTime} onChange={(e) => updateDay(idx, 'endTime', e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={handleSaveSchedule} className="btn-primary mt-4">
            <Save className="h-4 w-4" /> Save schedule template
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
