import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Stethoscope, Users, CalendarClock, CreditCard, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
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

export default function AdminPatients() {
  const [patients, setPatients] = useState(null);

  const load = useCallback(() => {
    api.get('/admin/patients').then(({ data }) => setPatients(data.data.patients));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (id, isActive) => {
    try {
      await api.put(`/admin/patients/${id}/status`, { isActive: !isActive });
      toast.success(!isActive ? 'Patient activated' : 'Patient suspended');
      load();
    } catch (err) { /* handled globally */ }
  };

  const removePatient = async (id) => {
    if (!window.confirm('Permanently remove this patient account?')) return;
    try {
      await api.delete(`/admin/patients/${id}`);
      toast.success('Patient removed');
      load();
    } catch (err) { /* handled globally */ }
  };

  return (
    <DashboardLayout links={links} title="Manage Patients">
      {patients === null ? (
        <RowSkeleton count={6} />
      ) : patients.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No patients found.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink/50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink/50">{p.email}</p>
                  </td>
                  <td className="p-4 text-ink/70">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                  <td className="p-4">
                    <span className={`badge ${p.isActive ? 'bg-teal-50 text-teal-700' : 'bg-coral-50 text-coral-600'}`}>
                      {p.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(p._id, p.isActive)} className="btn-secondary px-3 py-1.5 text-xs">
                        {p.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => removePatient(p._id)} className="btn-secondary border-coral-500 px-3 py-1.5 text-xs text-coral-600">
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
    </DashboardLayout>
  );
}
