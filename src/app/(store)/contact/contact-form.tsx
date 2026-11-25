"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Send } from "lucide-react";
import { sendContactMessage } from "@/lib/actions/store";
import { Turnstile } from "@/components/turnstile";

export function ContactForm({ initialTopic, siteKey, title, topics }: { initialTopic?: string; siteKey?: string; title: string; topics: string[] }) {
  const [state, action, pending] = useActionState(sendContactMessage, undefined);
  const [robotError, setRobotError] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {state?.ok ? (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="bg-gradient-brand grid size-16 place-items-center rounded-full text-white shadow-lg">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="text-2xl font-semibold">Message sent</h2>
          <p className="max-w-sm text-muted">{state.ok}</p>
        </motion.div>
      ) : (
        // No exit animation: the success message must never wait on an animation to appear.
        <form
          key="form"
          action={action}
          onSubmit={(e) => {
            // Stop here (keeping what was typed) until the "I'm not a robot" box is ticked.
            const token = new FormData(e.currentTarget).get("cf-turnstile-response");
            if (siteKey && !token) {
              e.preventDefault();
              setRobotError(true);
            } else setRobotError(false);
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <h2 className="text-xl font-semibold sm:col-span-2">{title}</h2>
          {state?.error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300 sm:col-span-2">{state.error}</p>
          )}
          <label className="block">
            <span className="label">Your name</span>
            <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="input h-11" />
          </label>
          <label className="block">
            <span className="label">Email address</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" className="input h-11" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Topic</span>
            <select name="topic" defaultValue={topics.includes(initialTopic ?? "") ? initialTopic : topics[0]} className="input h-11">
              {topics.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Message</span>
            <textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder="How can we help?" className="input" />
          </label>
          {siteKey && (
            <div className="sm:col-span-2">
              <Turnstile siteKey={siteKey} resetKey={state} />
              {robotError && <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-300">Please tick &quot;I&apos;m not a robot&quot; first.</p>}
            </div>
          )}
          <button disabled={pending} className="btn-primary sm:col-span-2">
            <Send className="size-4" />
            {pending ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </AnimatePresence>
  );
}
