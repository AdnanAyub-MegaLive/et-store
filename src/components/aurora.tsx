/**
 * Soft, slowly drifting colour blobs behind the top of every page. Pure CSS, no JS.
 * max-h-full keeps it inside the page content, so on short pages (login, cart) it never spills over the footer.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] max-h-full overflow-hidden">
      <div className="aurora-blob left-[-8%] top-[-160px] size-[520px] bg-[#8b5cf6]/30 [animation-duration:22s]" />
      <div className="aurora-blob right-[-6%] top-[-120px] size-[460px] bg-[#ec4899]/20 [animation-delay:-6s] [animation-duration:26s]" />
      <div className="aurora-blob left-[35%] top-[160px] size-[420px] bg-[#06b6d4]/15 [animation-delay:-12s] [animation-duration:30s]" />
      <div className="aurora-blob right-[25%] top-[320px] size-[300px] bg-[#f59e0b]/10 [animation-delay:-3s] [animation-duration:24s]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,var(--color-page))]" />
    </div>
  );
}
