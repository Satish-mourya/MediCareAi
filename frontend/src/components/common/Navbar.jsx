import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'doctor' ? '/doctor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-ink/70 hover:text-teal-700">
            Home
          </Link>
          <Link to="/doctors" className="text-sm font-medium text-ink/70 hover:text-teal-700">
            Find Doctors
          </Link>
          {!user && (
            <Link to="/about" className="text-sm font-medium text-ink/70 hover:text-teal-700">
              How It Works
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={dashboardPath} className="btn-ghost">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-2 pt-3">
            <Link to="/doctors" onClick={() => setOpen(false)} className="btn-ghost justify-start">
              Find Doctors
            </Link>
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="btn-ghost justify-start">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
