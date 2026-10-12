import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2, Trash2, CalendarX, Pencil, X, Info } from 'lucide-react';
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
  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const selectedDayOfWeek = new Date(date).getDay();
  const isSunday = selectedDayOfWeek === 0;

  const loadSlots = useCallback(async () => {
    setSlots(null);
    try {
      const profileRes = await api.get('/doctors/me/profile');
      const id = profileRes.data.data.doctor._id;
      setDoctorId(id);
      const { data } = await api.get(`/doctors/${id}/slots`, { params: { date, all: 'true' } });
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

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setSavingEdit(true);
    try {
      await api.put(`/doctors/me/slots/${editingSlot._id}`, {
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
      });
      toast.success('Slot updated successfully');
      setEditingSlot(null);
      loadSlots();
    } catch (err) {
      /* handled globally */
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
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
          <h3 className="font-display text-base font-semibold text-ink">Add Custom Slots</h3>
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
                {[15, 30, 45, 60].map((d) => (
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
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-base font-semibold text-ink">
              Slots for {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            {isSunday ? (
              <span className="badge bg-amber-100 text-amber-800 text-xs w-fit">Sunday (Closed by default)</span>
            ) : (
              <span className="badge bg-teal-100 text-teal-800 text-xs w-fit">Mon–Sat Working Day</span>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-teal-700 mt-0.5" />
            <div>
              <p className="font-medium">Automatic 5 Initial 1-Hour Slots</p>
              <p className="text-teal-800/80 mt-0.5 leading-relaxed">
                5 standard 1-hour slots (09:00–10:00, 10:00–11:00, 11:00–12:00, 14:00–15:00, 15:00–16:00) are automatically ready for patients to book on every day except Sunday. Click the pencil icon below to edit any slot timing or trash icon to remove it.
              </p>
            </div>
          </div>

          {slots === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-ink/70">
                {isSunday ? 'No slots scheduled for Sunday (Clinic is closed).' : 'No slots found for this date.'}
              </p>
              <p className="mt-1 text-xs text-ink/40">
                You can create custom slots using the form on the left.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <div
                  key={slot._id}
                  className={`group relative rounded-xl border p-3.5 transition ${
                    slot.isBooked
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-border bg-card hover:border-teal-300 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-ink">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    {slot.isBooked && (
                      <span className="badge bg-amber-100 text-amber-800 text-[10px]">Booked</span>
                    )}
                  </div>

                  {!slot.isBooked && (
                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                      <button
                        onClick={() =>
                          setEditingSlot({
                            _id: slot._id,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                        title="Edit slot time"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slot._id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-coral-600 hover:bg-coral-50"
                        title="Delete slot"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="font-display text-base font-semibold text-ink">Edit Slot Time</h4>
              <button onClick={() => setEditingSlot(null)} className="rounded-lg p-1 text-ink/40 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateSlot} className="mt-4 space-y-4">
              <div>
                <label className="label">Start time</label>
                <input
                  type="time"
                  required
                  className="input-field"
                  value={editingSlot.startTime}
                  onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">End time</label>
                <input
                  type="time"
                  required
                  className="input-field"
                  value={editingSlot.endTime}
                  onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
