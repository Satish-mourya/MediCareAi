import { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarClock, CreditCard, UserCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axios';

const links = [
  { to: '/patient/dashboard', label: 'Symptom Checker', icon: LayoutDashboard, end: true },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/patient/payments', label: 'Payments', icon: CreditCard },
  { to: '/patient/profile', label: 'Profile', icon: UserCircle },
];

export default function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/patients/me').then(({ data }) => {
      const p = data.data.patient;
      setProfile(p);
      setForm({
        name: p.user?.name || '',
        phone: p.user?.phone || '',
        bloodGroup: p.bloodGroup || '',
        height: p.height || '',
        weight: p.weight || '',
        allergies: (p.allergies || []).join(', '),
        chronicConditions: (p.chronicConditions || []).join(', '),
      });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/patients/me', {
        ...form,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Profile updated');
    } catch (err) {
      /* handled globally */
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <DashboardLayout links={links} title="Profile">
        <div className="skeleton h-96 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links} title="Profile">
      <form onSubmit={handleSave} className="card max-w-2xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Blood group</label>
            <select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" className="input-field" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" className="input-field" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">Allergies (comma-separated)</label>
          <input className="input-field" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
        </div>
        <div>
          <label className="label">Chronic conditions (comma-separated)</label>
          <input className="input-field" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </DashboardLayout>
  );
}
