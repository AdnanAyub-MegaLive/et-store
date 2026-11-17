"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordInput({ name = "password", placeholder = "Enter your password", autoComplete = "current-password" }: { name?: string; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required maxLength={128} placeholder={placeholder} autoComplete={autoComplete} className="input h-11 pr-10" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
