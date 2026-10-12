import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase } from 'lucide-react';

export default function DoctorCard({ doctor }) {
  const rawName = doctor.user?.name || 'Doctor';
  const displayName = /^dr\.?\s+/i.test(rawName) ? rawName : `Dr. ${rawName}`;
  const initials = rawName
    .replace(/^dr\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DR';

  return (
    <div className="card group flex flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-start gap-3.5">
          {doctor.user?.avatar?.url ? (
            <img
              src={doctor.user.avatar.url}
              alt={displayName}
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-teal-100"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-inner">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold text-ink" title={displayName}>
              {displayName}
            </h3>
            <span className="mt-0.5 inline-block rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
              {doctor.specialization}
            </span>
            <div className="mt-1 flex items-center gap-1 text-xs text-ink/60">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-ink">{doctor.ratingAverage ? doctor.ratingAverage.toFixed(1) : 'New'}</span>
              <span>({doctor.ratingCount || 0} reviews)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-xs text-ink/70">
          <div className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span className="truncate">{doctor.experienceYears}+ years experience</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span className="truncate" title={`${doctor.hospital?.name || ''}, ${doctor.hospital?.city || ''}`}>
              {doctor.hospital?.name ? `${doctor.hospital.name}${doctor.hospital.city ? `, ${doctor.hospital.city}` : ''}` : 'Clinic'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/40">Fee</p>
          <p className="font-display text-base font-bold text-teal-900">₹{doctor.consultationFee}</p>
        </div>
        <Link
          to={`/doctors/${doctor._id}`}
          className="btn-primary shrink-0 px-3.5 py-2 text-xs font-semibold"
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
