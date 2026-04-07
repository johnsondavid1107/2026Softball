import { LOCATION } from "@/lib/schedule";

export function LocationHeader() {
  const mapsHref = `https://maps.apple.com/?q=${encodeURIComponent(
    `${LOCATION.name}, ${LOCATION.address}, Hillsdale NJ`
  )}`;

  return (
    <section className="px-5 pt-6 pb-4 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-team-green/60">
        Home Field
      </div>
      <a
        href={mapsHref}
        className="mt-1 inline-flex items-center gap-1.5 text-xl font-bold text-team-green-dark active:opacity-60"
      >
        <PinIcon />
        {LOCATION.name}
      </a>
      <div className="text-sm text-team-green/70">{LOCATION.address}</div>
    </section>
  );
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
    </svg>
  );
}
