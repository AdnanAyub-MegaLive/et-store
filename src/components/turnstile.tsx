"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => (window.turnstile ? resolve(window.turnstile) : reject()));
    s.addEventListener("error", () => reject());
  });
}

type Status = "idle" | "checking" | "done" | "error";

/**
 * "I'm not a robot" checkbox. Nothing is checked until the visitor clicks it; then Cloudflare Turnstile runs
 * (and only shows a challenge if it is unsure). Adds a hidden `cf-turnstile-response` field to the form.
 * Change `resetKey` to start over (a token can only be used once).
 */
export function Turnstile({ siteKey, resetKey }: { siteKey: string; resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then((api) => {
        if (cancelled || !box.current || widget.current) return;
        const dark = document.documentElement.classList.contains("dark");
        widget.current = api.render(box.current, {
          sitekey: siteKey,
          theme: dark ? "dark" : "light",
          execution: "execute", // wait for the click
          appearance: "interaction-only", // only visible if a challenge is needed
          callback: () => setStatus("done"),
          "expired-callback": () => setStatus("idle"),
          "error-callback": () => setStatus("error"),
        });
      })
      .catch(() => setStatus("error"));
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  // New form result (e.g. an error): untick and start over.
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setStatus("idle");
  }
  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  const start = () => {
    if (status === "checking" || status === "done" || !widget.current) return;
    setStatus("checking");
    window.turnstile?.reset(widget.current);
    window.turnstile?.execute(widget.current);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={status === "done"}
        onClick={start}
        className="flex w-fit items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium transition hover:border-brand/50"
      >
        <span
          className={`grid size-6 place-items-center rounded-md border-2 transition ${status === "done" ? "border-emerald-500 bg-emerald-500 text-white" : "border-line bg-panel"}`}
        >
          {status === "checking" ? <Loader2 className="size-4 animate-spin text-brand" /> : status === "done" ? <Check className="size-4" /> : null}
        </span>
        I&apos;m not a robot
      </button>
      {status === "error" && <p className="text-xs text-red-600 dark:text-red-300">Check failed. Click the box to try again.</p>}
      <div ref={box} />
    </div>
  );
}
