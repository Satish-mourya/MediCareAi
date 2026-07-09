import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Briefcase, GraduationCap, Languages, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/common/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { format, addDays } from 'date-fns';

export default function DoctorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  const dateOptions = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  useEffect(() => {
    api.get(`/doctors/${id}`).then(({ data }) => {
      setDoctor(data.data.doctor);
      setReviews(data.data.reviews);
    });
  }, [id]);

  useEffect(() => {
    setSlots(null);
    setSelectedSlot(null);
    api
      .get(`/doctors/${id}/slots`, { params: { date: selectedDate } })
      .then(({ data }) => setSlots(data.data.slots))
      .catch(() => setSlots([]));
  }, [id, selectedDate]);

  const handleBook = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'patient') return toast.error('Only patients can book appointments');
    if (!selectedSlot) return toast.error('Please select a time slot');

    setBooking(true);
    try {
      // 1. Create the appointment (slot gets locked) + a Razorpay order server-side
      const { data } = await api.post('/appointments', {
        doctorId: id,
        slotId: selectedSlot._id,
        reasonForVisit: reason,
      });
      const {
        appointment, razorpayOrderId, razorpayKeyId, amount, currency,
        doctorName, patientName, patientEmail, patientPhone,
      } = data.data;

      // 2. Load Razorpay's Checkout widget script (only fetched once per session)
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Unable to load payment gateway. Check your connection and try again.');
        setBooking(false);
        return;
      }

      // 3. Open the Razorpay Checkout modal
      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount,
        currency,
        name: 'MediCare AI',
        description: `Consultation with Dr. ${doctorName}`,
        order_id: razorpayOrderId,
        prefill: { name: patientName, email: patientEmail, contact: patientPhone },
        theme: { color: '#146356' },
        handler: async (response) => {
          // 4. On success, Razorpay gives us order/payment/signature - verify server-side
          try {
            await api.post(`/appointments/${appointment._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Appointment confirmed.');
            navigate('/patient/appointments');
          } catch (err) {
            /* toast handled globally by the axios interceptor */
          }
        },
        modal: {
          // If the patient closes the modal without paying, the appointment
          // stays in 'pending_payment' status (visible under Upcoming) rather
          // than being auto-cancelled, so they can retry payment later.
          ondismiss: () => {
            toast('Payment cancelled. You can retry from "My Appointments".', { icon: 'ℹ️' });
          },
        },
      });

      razorpay.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (err) {
      /* toast handled globally */
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="container-shell py-10">
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="container-shell grid gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              {doctor.user?.avatar?.url ? (
                <img src={doctor.user.avatar.url} alt="" className="h-24 w-24 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-semibold text-white">
                  {doctor.user?.name?.[0]}
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">Dr. {doctor.user?.name}</h1>
                <p className="text-teal-700">{doctor.specialization}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink/60">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {doctor.ratingAverage?.toFixed(1) || 'New'} ({doctor.ratingCount} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> {doctor.experienceYears}+ yrs
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {doctor.hospital?.city}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm text-ink/70">{doctor.about}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold text-ink/50">Qualifications</p>
                  <p className="text-sm text-ink/70">{doctor.qualifications?.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Languages className="mt-0.5 h-4 w-4 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold text-ink/50">Languages</p>
                  <p className="text-sm text-ink/70">{doctor.languages?.join(', ') || 'English'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Patient Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink/50">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r._id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{r.patient?.name}</p>
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {r.rating}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card sticky top-24 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Consultation fee</p>
              <p className="font-display text-2xl font-bold text-ink">₹{doctor.consultationFee}</p>
            </div>

            <div className="mt-5">
              <p className="label flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Select date
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const active = dateStr === selectedDate;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs ${
                        active ? 'border-teal-700 bg-teal-700 text-white' : 'border-border text-ink/60'
                      }`}
                    >
                      <span>{format(d, 'EEE')}</span>
                      <span className="font-semibold">{format(d, 'd')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="label">Available time slots</p>
              {slots === null ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-9" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-ink/50">No slots available on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot._id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                        selectedSlot?._id === slot._id
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-border text-ink/70 hover:border-teal-300'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="label">Reason for visit (optional)</label>
              <textarea
                className="input-field min-h-[70px] resize-none"
                placeholder="Briefly describe your symptoms for the doctor..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button
              onClick={handleBook}
              disabled={booking || !selectedSlot}
              className="btn-primary mt-5 w-full py-3"
            >
              {booking ? 'Opening payment window...' : 'Book & Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
