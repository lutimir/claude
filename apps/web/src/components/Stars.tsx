export function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-amber-500" aria-label={`${rating}/5`}>
      {"★".repeat(rounded)}
      <span className="text-neutral-300 dark:text-neutral-600">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
