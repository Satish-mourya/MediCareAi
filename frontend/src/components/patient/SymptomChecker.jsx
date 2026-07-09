import { useState } from 'react';
import { Sparkles, Send, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import UrgencyBadge from '../common/UrgencyBadge';
import DoctorCard from './DoctorCard';
import { DoctorCardSkeleton } from '../common/Skeletons';
import { Link } from 'react-router-dom';

export default function SymptomChecker() {
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (symptomText.trim().length < 8) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/symptom-check', { symptomText });
      setResult(data.data);
    } catch (err) {
      /* toast handled globally */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">AI Symptom Checker</h2>
            <p className="text-xs text-ink/50">Describe how you feel in your own words</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            className="input-field min-h-[110px] resize-none"
            placeholder="e.g. I've had a fever and headache for the last three days, along with body aches..."
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            maxLength={1000}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-ink/40">{symptomText.length}/1000</span>
            <button type="submit" disabled={loading || symptomText.trim().length < 8} className="btn-primary">
              <Send className="h-4 w-4" /> {loading ? 'Analyzing...' : 'Analyze symptoms'}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="card p-6">
          <div className="skeleton h-4 w-1/3" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="animate-fadeUp space-y-6">
          {result.analysis.urgencyLevel === 'emergency' && (
            <div className="flex items-start gap-3 rounded-2xl border border-coral-100 bg-coral-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
              <div>
                <p className="font-semibold text-coral-600">
                  This may be a medical emergency. Please seek immediate in-person care or call your
                  local emergency number.
                </p>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-ink">Analysis Summary</h3>
              <UrgencyBadge level={result.analysis.urgencyLevel} />
            </div>
            <p className="mt-3 text-sm text-ink/70">{result.analysis.summary}</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Possible causes
                </p>
                <ul className="space-y-1.5 text-sm text-ink/70">
                  {result.analysis.possibleCauses.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Self-care tips
                </p>
                <ul className="space-y-1.5 text-sm text-ink/70">
                  {result.analysis.selfCareTips.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-coral-600">
                  Precautions
                </p>
                <ul className="space-y-1.5 text-sm text-ink/70">
                  {result.analysis.precautions.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral-500" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
              {result.analysis.redFlagSymptoms?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-coral-600">
                    Seek immediate care if you notice
                  </p>
                  <ul className="space-y-1.5 text-sm text-ink/70">
                    {result.analysis.redFlagSymptoms.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="mt-5 rounded-xl bg-surface p-3 text-xs italic text-ink/50">
              {result.analysis.disclaimer}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink">
                Recommended: {result.analysis.recommendedSpecialization}s near you
              </h3>
              <Link
                to={`/doctors?specialization=${encodeURIComponent(result.analysis.recommendedSpecialization)}`}
                className="text-sm font-semibold text-teal-700"
              >
                View more &rarr;
              </Link>
            </div>
            {result.recommendedDoctors.length === 0 ? (
              <p className="text-sm text-ink/50">
                No approved doctors found for this specialization yet. Try browsing all doctors.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.recommendedDoctors.map((doc) => (
                  <DoctorCard key={doc._id} doctor={doc} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
