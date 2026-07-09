import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Stethoscope, Users, CalendarClock, CreditCard, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';

const links = [
  { to: '/admin/dashboard', label: 'Analytics', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
];

const specializations = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician',
  'Orthopedic', 'Gynecologist', 'ENT Specialist', 'Psychiatrist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Ophthalmologist', 'Dentist', 'Urologist',
  'Oncologist', 'Nephrologist', 'Rheumatologist',
];

const statusStyles = {
  approved: 'bg-teal-50 text-teal-700',
  pending: 'bg-amber-400/15 text-amber-500',
  suspended: 'bg-coral-50 text-coral-600',
  rejected: 'bg-ink/10 text-ink/60',
};

function AddDoctorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', specialization: specializations[0],
    experienceYears: '', consultationFee: '', hospitalName: '', hospitalCity: '',
    licenseNumber: '', qualifications: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/doctors', {
        name: form.name, email: form.email, password: form.password, phone: form.phone,
        specialization: form.specialization,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        hospital: { name: form.hospitalName, city: form.hospitalCity },
        licenseNumber: form.licenseNumber,
        qualifications: form.qualifications.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Doctor account created');
      onCreated();
    } catch (err) {
      /* handled globally */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="card my-8 w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Add Doctor</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-ink/50" /></button>
        </div>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Temporary password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Phone" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}>
            {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input required placeholder="License number" className="input-field" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          <input required type="number" placeholder="Experience (years)" className="input-field" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
          <input required type="number" placeholder="Consultation fee (₹)" className="input-field" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
          <input required placeholder="Hospital name" className="input-field" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
          <input placeholder="City" className="input-field" value={form.hospitalCity} onChange={(e) => setForm({ ...form, hospitalCity: e.target.value })} />
          <input placeholder="Qualifications (comma-separated)" className="input-field sm:col-span-2" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">
            {saving ? 'Creating...' : 'Create Doctor Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setDoctors(null);
    api
      .get('/admin/doctors', { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setDoctors(data.data.doctors))
      .catch(() => setDoctors([]));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/doctors/${id}/status`, { status });
      toast.success(`Doctor ${status}`);
      load();
    } catch (err) { /* handled globally */ }
  };

  const removeDoctor = async (id) => {
    if (!window.confirm('Permanently remove this doctor account?')) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor removed');
      load();
    } catch (err) { /* handled globally */ }
  };

  return (
    <DashboardLayout links={links} title="Manage Doctors">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'approved', 'suspended'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${statusFilter === s ? 'bg-teal-700 text-white' : 'bg-card text-ink/60'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Doctor
        </button>
      </div>

      {doctors === null ? (
        <RowSkeleton count={6} />
      ) : doctors.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No doctors found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink/50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d._id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-ink">Dr. {d.user?.name}</p>
                    <p className="text-xs text-ink/50">{d.user?.email}</p>
                  </td>
                  <td className="p-4 text-ink/70">{d.specialization}</td>
                  <td className="p-4"><span className={`badge ${statusStyles[d.status]}`}>{d.status}</span></td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {d.status !== 'approved' && (
                        <button onClick={() => updateStatus(d._id, 'approved')} className="btn-secondary px-3 py-1.5 text-xs">Approve</button>
                      )}
                      {d.status !== 'suspended' && (
                        <button onClick={() => updateStatus(d._id, 'suspended')} className="btn-secondary px-3 py-1.5 text-xs">Suspend</button>
                      )}
                      <button onClick={() => removeDoctor(d._id)} className="btn-secondary border-coral-500 px-3 py-1.5 text-xs text-coral-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddDoctorModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </DashboardLayout>
  );
}
