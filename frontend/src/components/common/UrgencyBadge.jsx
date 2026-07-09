const styles = {
  low: 'bg-teal-50 text-teal-700',
  moderate: 'bg-amber-400/15 text-amber-500',
  high: 'bg-coral-50 text-coral-600',
  emergency: 'bg-coral-500 text-white',
};

const labels = {
  low: 'Low urgency',
  moderate: 'Moderate urgency',
  high: 'High urgency',
  emergency: 'Emergency — seek care now',
};

export default function UrgencyBadge({ level }) {
  return (
    <span className={`badge ${styles[level] || styles.moderate}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[level] || 'Moderate urgency'}
    </span>
  );
}
