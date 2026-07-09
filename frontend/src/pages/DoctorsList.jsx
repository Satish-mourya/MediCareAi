import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import DoctorCard from '../components/patient/DoctorCard';
import { DoctorCardSkeleton } from '../components/common/Skeletons';
import api from '../api/axios';

export default function DoctorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const specialization = searchParams.get('specialization') || '';

  useEffect(() => {
    api.get('/doctors/specializations/list').then(({ data }) => setSpecializations(data.data.specializations));
  }, []);

  useEffect(() => {
    setDoctors(null);
    api
      .get('/doctors', { params: { specialization, search, page: 1, limit: 12 } })
      .then(({ data }) => {
        setDoctors(data.data.doctors);
        setPagination(data.data.pagination);
      })
      .catch(() => setDoctors([]));
  }, [specialization, search]);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="container-shell py-10">
        <h1 className="font-display text-2xl font-bold text-ink">Find a Doctor</h1>
        <p className="mt-1 text-sm text-ink/60">
          {pagination.total ? `${pagination.total} doctors available` : 'Search by specialization or name'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              className="input-field pl-10"
              placeholder="Search doctors by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field sm:w-64"
            value={specialization}
            onChange={(e) => setSearchParams(e.target.value ? { specialization: e.target.value } : {})}
          >
            <option value="">All specializations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors === null
            ? Array.from({ length: 8 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : doctors.length === 0
            ? <p className="col-span-full text-center text-sm text-ink/50">No doctors found matching your criteria.</p>
            : doctors.map((doc) => <DoctorCard key={doc._id} doctor={doc} />)}
        </div>
      </div>
    </div>
  );
}
