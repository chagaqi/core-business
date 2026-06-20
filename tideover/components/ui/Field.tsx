"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

const baseInput =
  "w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-teal";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {hint ? <span className="text-[12px] text-ink-mute">{hint}</span> : null}
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(baseInput, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(baseInput, "min-h-[96px] resize-y leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(baseInput, props.className)} />;
}
