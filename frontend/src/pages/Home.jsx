import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Clock, Stethoscope, ArrowRight, Star } from 'lucide-react';
import Navbar from '../components/common/Navbar';

const steps = [
  {
    title: 'Describe your symptoms',
    desc: 'Tell our AI triage assistant what you’re experiencing, in your own words.',
    icon: Sparkles,
  },
  {
    title: 'Get matched instantly',
    desc: 'We surface the right specialists based on your AI analysis — no guesswork.',
    icon: Stethoscope,
  },
  {
    title: 'Book & pay securely',
    desc: 'Pick a slot, pay online, and get a confirmed appointment in minutes.',
    icon: Clock,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="container-shell grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered triage, built with Gemini
            </span>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Know what to do next <span className="text-teal-700">before</span> you see a doctor.
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink/60">
              Describe your symptoms in plain language. Our AI triage assistant flags urgency,
              suggests the right specialist, and books you in — all in one flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">
                Check your symptoms <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/doctors" className="btn-secondary px-6 py-3 text-base">
                Browse doctors
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink/50">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> HIPAA-minded data handling
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.8/5 from patients
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="card w-full max-w-md p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                AI Symptom Checker — Preview
              </p>
              <div className="mt-3 rounded-xl bg-surface p-4 text-sm text-ink/70">
                "I've had a fever and headache for the last three days, with some body aches."
              </div>
              <svg viewBox="0 0 300 60" className="my-4 w-full text-teal-600">
                <path
                  d="M0 30 H70 L85 10 L100 50 L115 30 H160 L175 15 L190 45 L205 30 H300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="240"
                  className="animate-pulseLine"
                />
              </svg>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-500">
                  Moderate urgency
                </div>
                <div className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
                  Recommended: <strong>General Physician</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <h2 className="text-center font-display text-3xl font-bold text-ink">How it works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-6 animate-fadeUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-teal-700 py-16 text-white">
        <div className="container-shell flex flex-col items-center text-center">
          <h2 className="font-display text-3xl font-bold">Ready to feel better, faster?</h2>
          <p className="mt-3 max-w-md text-teal-50/80">
            Create your free account and get an AI-powered read on your symptoms in under a minute.
          </p>
          <Link to="/register" className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-700">
            Get started — it's free
          </Link>
        </div>
      </section>

      <footer className="container-shell flex flex-col items-center gap-3 py-10 text-sm text-ink/50 sm:flex-row sm:justify-between">
        <span>&copy; {new Date().getFullYear()} MediCare AI. All rights reserved.</span>
        <span>Not a substitute for professional medical advice.</span>
      </footer>
    </div>
  );
}
