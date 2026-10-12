import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, Clock3, UserCircle2, Sparkles, CheckCircle2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import api from '../../api/axios';
import { format } from 'date-fns';

const links = [
  { to: '/doctor/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctor/slots', label: 'Manage Slots', icon: Clock3 },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/profile', label: 'Profile', icon: UserCircle2 },
];

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notes, setNotes] = useState({ diagnosis: '', prescription: '', notes: '', followUpDate: '' });
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    api.get(`/appointments/${id}`).then(({ data }) => setAppointment(data.data.appointment));
  }, [id]);

  const generateSummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.get(`/ai/doctor-summary/${id}`);
      setAiSummary(data.data.summary);
    } catch (err) {
      /* handled globally */
    } finally {
      setAiLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setCompleting(true);
    try {
      await api.put(`/appointments/${id}/complete`, notes);
      toast.success('Appointment marked as completed');
      navigate('/doctor/appointments');
    } catch (err) {
      /* handled globally */
    } finally {
      setCompleting(false);
    }
  };

  if (!appointment) {
    return (
      <DashboardLayout links={links} title="Appointment">
        <div className="skeleton h-96 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links} title="Appointment Detail">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-lg font-semibold text-white">
                {appointment.patient?.name?.[0]}
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">{appointment.patient?.name}</h2>
                <p className="text-sm text-ink/50">
                  {format(new Date(appointment.date), 'MMMM d, yyyy')} &middot; {appointment.startTime} - {appointment.endTime}
                </p>

              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-ink/70 sm:grid-cols-4">
              <div><p className="text-xs text-ink/40">Phone</p>{appointment.patient?.phone || '—'}</div>
              <div><p className="text-xs text-ink/40">Gender</p><span className="capitalize">{appointment.patient?.gender || '—'}</span></div>
              <div><p className="text-xs text-ink/40">Status</p><span className="capitalize">{appointment.status.replace('_',' ')}</span></div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display text-base font-semibold text-ink">Reason for Visit</h3>
            <p className="mt-2 text-sm text-ink/70">
              {appointment.reasonForVisit || 'Patient did not submit symptom details before booking.'}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-700" />
                <h3 className="font-display text-base font-semibold text-ink">AI Pre-Consultation Summary</h3>
              </div>
              {!aiSummary && appointment.reasonForVisit && (
                <button onClick={generateSummary} disabled={aiLoading} className="btn-secondary text-xs">
                  {aiLoading ? 'Generating...' : 'Generate Summary'}
                </button>
              )}
            </div>

            {!appointment.reasonForVisit ? (
              <p className="mt-3 text-sm text-ink/50">No symptom data available to summarize.</p>
            ) : aiSummary ? (
              <div className="mt-4 space-y-4 animate-fadeUp">
                <UrgencyBadge level={aiSummary.urgencyLevel} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-teal-700">Possible conditions</p>
                    <ul className="space-y-1 text-sm text-ink/70">
                      {aiSummary.possibleConditions.map((c, i) => <li key={i}>&bull; {c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-teal-700">Key symptoms</p>
                    <ul className="space-y-1 text-sm text-ink/70">
                      {aiSummary.keySymptoms.map((c, i) => <li key={i}>&bull; {c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-teal-700">Suggested questions</p>
                    <ul className="space-y-1 text-sm text-ink/70">
                      {aiSummary.suggestedQuestions.map((c, i) => <li key={i}>&bull; {c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-teal-700">Possible tests</p>
                    <ul className="space-y-1 text-sm text-ink/70">
                      {aiSummary.possibleTests.map((c, i) => <li key={i}>&bull; {c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/50">Click "Generate Summary" for an AI-prepared briefing.</p>
            )}
          </div>
        </div>

        <div className="card h-fit p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-700" />
            <h3 className="font-display text-base font-semibold text-ink">Consultation Notes</h3>
          </div>
          {appointment.status === 'completed' ? (
            <div className="mt-4 space-y-3 text-sm text-ink/70">
              <div className="flex items-center gap-2 text-teal-700">
                <CheckCircle2 className="h-4 w-4" /> Appointment completed
              </div>
              <p><strong>Diagnosis:</strong> {appointment.consultationNotes?.diagnosis || '—'}</p>
              <p><strong>Prescription:</strong> {appointment.consultationNotes?.prescription || '—'}</p>
              <p><strong>Notes:</strong> {appointment.consultationNotes?.notes || '—'}</p>
            </div>
          ) : (
            <form onSubmit={handleComplete} className="mt-4 space-y-3">
              <div>
                <label className="label">Diagnosis</label>
                <input className="input-field" value={notes.diagnosis} onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })} />
              </div>
              <div>
                <label className="label">Prescription</label>
                <textarea className="input-field min-h-[70px] resize-none" value={notes.prescription} onChange={(e) => setNotes({ ...notes, prescription: e.target.value })} />
              </div>
              <div>
                <label className="label">Additional notes</label>
                <textarea className="input-field min-h-[70px] resize-none" value={notes.notes} onChange={(e) => setNotes({ ...notes, notes: e.target.value })} />
              </div>
              <div>
                <label className="label">Follow-up date</label>
                <input type="date" className="input-field" value={notes.followUpDate} onChange={(e) => setNotes({ ...notes, followUpDate: e.target.value })} />
              </div>
              <button type="submit" disabled={completing} className="btn-primary w-full">
                {completing ? 'Saving...' : 'Mark as Completed'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
