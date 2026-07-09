import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Stethoscope, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';
import api from '../../api/axios';

const specializations = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician',
  'Orthopedic', 'Gynecologist', 'ENT Specialist', 'Psychiatrist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Ophthalmologist', 'Dentist', 'Urologist',
  'Oncologist', 'Nephrologist', 'Rheumatologist',
];

const initialForm = {
  name: '', email: '', password: '', phone: '',
  specialization: specializations[0], licenseNumber: '',
  experienceYears: '', consultationFee: '',
  hospitalName: '', hospitalCity: '', hospitalAddress: '',
  qualifications: '', languages: '', about: '',
};

export default function RegisterDoctor() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register-doctor', {
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
      });
      setSubmitted(true);
      toast.success('Registration submitted for review');
    } catch (err) {
      /* toast handled globally by axios interceptor */
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <CheckCircle2 className="h-7 w-7 text-teal-700" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Application submitted</h1>
          <p className="mt-2 text-sm text-ink/60">
            Thanks, Dr. {form.name.split(' ')[0]}. Your account is pending review by our admin
            team. You'll be able to log in once your credentials are verified and approved.
          </p>
          <Link to="/login" className="btn-primary mt-6 w-full">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="card w-full max-w-2xl p-8">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-700" />
          <h1 className="text-center font-display text-2xl font-bold text-ink">Join as a Doctor</h1>
        </div>
        <p className="mt-1 text-center text-sm text-ink/60">
          Submit your credentials — an admin will review and approve your account before you can log in.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Account details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input required className="input-field pl-10" placeholder="Dr. Jane Doe" value={form.name} onChange={update('name')} />
                </div>
              </div>
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input type="email" required className="input-field pl-10" placeholder="you@clinic.com" value={form.email} onChange={update('email')} />
                </div>
              </div>
              <div>
                <label className="label">Phone number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input className="input-field pl-10" placeholder="+91 90000 00000" value={form.phone} onChange={update('phone')} />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input type="password" required minLength={6} className="input-field pl-10" placeholder="At least 6 characters" value={form.password} onChange={update('password')} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Professional details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Specialization</label>
                <select required className="input-field" value={form.specialization} onChange={update('specialization')}>
                  {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Medical license number</label>
                <input required className="input-field" placeholder="e.g. MCI-123456" value={form.licenseNumber} onChange={update('licenseNumber')} />
              </div>
              <div>
                <label className="label">Years of experience</label>
                <input type="number" min="0" required className="input-field" value={form.experienceYears} onChange={update('experienceYears')} />
              </div>
              <div>
                <label className="label">Consultation fee (₹)</label>
                <input type="number" min="0" required className="input-field" value={form.consultationFee} onChange={update('consultationFee')} />
              </div>
              <div>
                <label className="label">Qualifications (comma-separated)</label>
                <input className="input-field" placeholder="MBBS, MD (Cardiology)" value={form.qualifications} onChange={update('qualifications')} />
              </div>
              <div>
                <label className="label">Languages spoken (comma-separated)</label>
                <input className="input-field" placeholder="English, Hindi" value={form.languages} onChange={update('languages')} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
              Hospital / clinic
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Hospital / clinic name</label>
                <input required className="input-field" value={form.hospitalName} onChange={update('hospitalName')} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input-field" value={form.hospitalCity} onChange={update('hospitalCity')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input-field" value={form.hospitalAddress} onChange={update('hospitalAddress')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">About (shown on your public profile)</label>
                <textarea className="input-field min-h-[80px] resize-none" value={form.about} onChange={update('about')} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Submitting...' : 'Submit for admin review'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already approved?{' '}
          <Link to="/login" className="font-semibold text-teal-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
