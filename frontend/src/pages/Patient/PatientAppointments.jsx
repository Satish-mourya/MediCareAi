import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, CalendarClock, CreditCard, UserCircle, Star, X, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RowSkeleton } from '../../components/common/Skeletons';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/patient/dashboard', label: 'Symptom Checker', icon: LayoutDashboard, end: true },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/patient/payments', label: 'Payments', icon: CreditCard },
  { to: '/patient/profile', label: 'Profile', icon: UserCircle },
];

const statusStyles = {
  confirmed: 'bg-teal-50 text-teal-700',
  pending_payment: 'bg-amber-400/15 text-amber-500',
  completed: 'bg-teal-700 text-white',
  cancelled: 'bg-coral-50 text-coral-600',
  no_show: 'bg-ink/10 text-ink/60',
};

function ReviewModal({ appointment, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/reviews', { appointmentId: appointment._id, rating, comment });
      toast.success('Review submitted');
      onSubmitted();
    } catch (err) {
      /* handled globally */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Rate your visit</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-ink/50" /></button>
        </div>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`h-7 w-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-ink/20'}`} />
            </button>
          ))}
        </div>
        <textarea
          className="input-field mt-4 min-h-[80px] resize-none"
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={submit} disabled={loading} className="btn-primary mt-4 w-full">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}

export default function PatientAppointments() {
  const [tab, setTab] = useState('upcoming');
  const [appointments, setAppointments] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const load = useCallback(() => {
    setAppointments(null);
    api
      .get('/appointments/my', { params: { status: tab } })
      .then(({ data }) => setAppointments(data.data.appointments))
      .catch(() => setAppointments([]));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelAppointment = async (id) => {
    const reason = window.prompt('Reason for cancelling (optional):') || '';
    try {
      await api.put(`/appointments/${id}/cancel`, { reason });
      toast.success('Appointment cancelled');
      load();
    } catch (err) {
      /* handled globally */
    }
  };

  return (
    <DashboardLayout links={links} title="Appointments">
      <div className="mb-6 flex gap-2">
        {['upcoming', 'history'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'bg-teal-700 text-white' : 'bg-card text-ink/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {appointments === null ? (
        <RowSkeleton count={5} />
      ) : appointments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/50">No {tab} appointments found.</div>
      ) : (
        <div className="space-y-4">
          {appointments.map((a) => (
            <div key={a._id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display font-semibold text-ink">Dr. {a.doctor?.user?.name}</p>
                <p className="text-sm text-teal-700">{a.doctor?.specialization}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {format(new Date(a.date), 'MMM d, yyyy')} &middot; {a.startTime} - {a.endTime}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${statusStyles[a.status]}`}>{a.status.replace('_', ' ')}</span>
                {a.status === 'confirmed' && (
                  <button onClick={() => cancelAppointment(a._id)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                )}
                {a.status === 'completed' && (
                  <button onClick={() => setReviewTarget(a)} className="btn-secondary text-xs">
                    Leave a review
                  </button>
                )}
                {['confirmed', 'completed'].includes(a.status) && (
                  <Link
                    to={`/video-call/${a._id}`}
                    className="btn-primary flex items-center gap-2 text-xs"
                  >
                    <Video className="h-3 w-3" /> Join Call
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
}
