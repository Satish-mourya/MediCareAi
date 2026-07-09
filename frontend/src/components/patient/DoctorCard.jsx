import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase } from 'lucide-react';

export default function DoctorCard({ doctor }) {
  const initials = doctor.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-lift">
      <div className="flex items-center gap-4">
        {doctor.user?.avatar?.url ? (
          <img
            src={doctor.user.avatar.url}
            alt={doctor.user.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-teal-100"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-700 text-lg font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-ink">
            Dr. {doctor.user?.name}
          </h3>
          <p className="text-sm text-teal-700">{doctor.specialization}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink/60">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-ink">{doctor.ratingAverage?.toFixed(1) || 'New'}</span>
            <span>({doctor.ratingCount || 0} reviews)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-ink/70">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-teal-600" />
          <span>{doctor.experienceYears}+ years experience</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-teal-600" />
          <span className="truncate">{doctor.hospital?.name}, {doctor.hospital?.city}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-ink/50">Consultation fee</p>
          <p className="font-display text-lg font-bold text-ink">₹{doctor.consultationFee}</p>
        </div>
        <Link to={`/doctors/${doctor._id}`} className="btn-primary">
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
