import { Link } from 'react-router-dom';
import Logo from '../components/common/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <Logo />
      <h1 className="mt-8 font-display text-6xl font-bold text-teal-700">404</h1>
      <p className="mt-2 text-ink/60">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
