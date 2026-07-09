import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2, Trash2, CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctor/slots', label: 'Manage Slots', icon: Clock3 },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle2 },
];

export default function DoctorSlots() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadSlots = useCallback(async () => {
    setSlots(null);
    try {
      const profileRes = await api.get('/doctors/me/profile');
      const id = profileRes.data.data.doctor._id;
      setDoctorId(id);
      const { data } = await api.get(`/doctors/${id}/slots`, { params: { date } });
      setSlots(data.data.slots);
    } catch (err) {
      setSlots([]);
    }
  }, [date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleCreateSlots = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/doctors/me/slots', {
        date,
        startTime,
        endTime,
        slotDurationMinutes: Number(duration),
      });
      toast.success(`${data.data.created.length} slot(s) created`);
      loadSlots();
    } catch (err) {
      /* handled globally */
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slotId) => {
    try {
      await api.delete(`/doctors/me/slots/${slotId}`);
      toast.success('Slot deleted');
      loadSlots();
    } catch (err) {
      /* handled globally */
    }
  };

  const handleMarkHoliday = async () => {
    if (!window.confirm(`Mark ${date} as a holiday? This clears all open slots for that day.`)) return;
    try {
      await api.post('/doctors/me/holidays', { date });
      toast.success('Holiday marked');
      loadSlots();
    } catch (err) {
      /* handled globally */
    }
  };

  return (
    <DashboardLayout links={links} title="Manage Slots">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-display text-base font-semibold text-ink">Create Slots</h3>
          <form onSubmit={handleCreateSlots} className="mt-4 space-y-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start time</label>
                <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="label">End time</label>
                <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Slot duration (minutes)</label>
              <select className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {[15, 20, 30, 45, 60].map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : 'Generate Slots'}
            </button>
          </form>
          <button onClick={handleMarkHoliday} className="btn-secondary mt-3 w-full">
            <CalendarX className="h-4 w-4" /> Mark this date as holiday
          </button>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-ink">
            Slots for {format(new Date(date), 'MMMM d, yyyy')}
          </h3>
          {slots === null ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">No slots created for this date yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {slots.map((slot) => (
                <div key={slot._id} className="group relative rounded-xl border border-border p-3 text-center">
                  <p className="text-sm font-medium text-ink">{slot.startTime}</p>
                  <p className="text-xs text-ink/40">to {slot.endTime}</p>
                  <button
                    onClick={() => handleDelete(slot._id)}
                    className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-coral-500 text-white group-hover:flex"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
