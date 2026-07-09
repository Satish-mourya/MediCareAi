import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const from =
        location.state?.from?.pathname ||
        (user.role === 'doctor' ? '/doctor/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard');
      navigate(from, { replace: true });
    } catch (err) {
      /* toast handled in interceptor */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="card w-full max-w-md p-8">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <h1 className="text-center font-display text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-ink/60">Log in to continue to your dashboard</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                type="email"
                required
                className="input-field pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                type="password"
                required
                className="input-field pl-10"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            <LogIn className="h-4 w-4" /> {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-teal-700">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink/60">
          Are you a doctor?{' '}
          <Link to="/register-doctor" className="font-semibold text-teal-700">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}
