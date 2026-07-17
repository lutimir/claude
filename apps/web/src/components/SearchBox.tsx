interface SearchBoxProps {
  placeholder: string;
  buttonLabel: string;
  defaultValue?: string;
}

export function SearchBox({ placeholder, buttonLabel, defaultValue }: SearchBoxProps) {
  return (
    <form action="/hladat" className="flex w-full gap-2">
      <input
        type="search"
        name="q"
        required
        minLength={2}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
