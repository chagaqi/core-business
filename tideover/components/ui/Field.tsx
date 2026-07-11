"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

const baseInput =
  "w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[16px] text-ink transition focus:border-teal";

/**
 * Field — labelled form row. Two shapes:
 *
 * - Default: children are ONE labelable control (input/textarea/select), and the
 *   wrapping <label> associates the text with it implicitly.
 * - `group`: children are themselves interactive (e.g. a row of toggle
 *   <button> chips). A wrapping <label> would make its "labeled control" the
 *   FIRST button — clicking the label text (or hint) would silently activate
 *   that button, and screen readers would mislabel it. So the group shape
 *   renders <fieldset>/<legend> instead, which labels the whole cluster and
 *   never forwards clicks.
 */
export function Field({
  label,
  hint,
  group,
  children,
}: {
  label: string;
  hint?: string;
  /** Set when children contain buttons/links — anything already interactive. */
  group?: boolean;
  children: ReactNode;
}) {
  const head = <span className="text-[13px] font-semibold text-ink">{label}</span>;
  const sub = hint ? <span className="text-[12px] text-ink-mute">{hint}</span> : null;
  if (group) {
    return (
      <fieldset className="m-0 min-w-0 border-0 p-0">
        {/* legend doesn't join flex layout, so the gap column lives on an inner div */}
        <legend className="p-0">{head}</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {sub}
          {children}
        </div>
      </fieldset>
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      {head}
      {sub}
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
