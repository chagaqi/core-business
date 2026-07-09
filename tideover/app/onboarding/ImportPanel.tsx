"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_ORDER_VALUE_CENTS, mapRows, parseCsv, type ImportFormat, type MappedRow } from "@/lib/csv";

/**
 * Rung-0 backer-list import (ADR-0010). The merchant picks their Kickstarter /
 * BackerKit export; it's parsed IN THIS COMPONENT (the browser) and only the
 * mapped rows shown in the preview leave the machine — the raw file never does.
 *
 * Two modes, one component:
 *  - STAGING (wizard): `onStage` is provided → parsing + preview only; clicking
 *    the action hands the mapped rows UP to the onboarding wizard, which submits
 *    them WITH the final POST so create-merchant + import is one atomic call.
 *  - DIRECT (legacy/standalone): `merchantId` is provided → the mapped rows are
 *    POSTed to /api/import for an already-created merchant.
 */

interface ImportPanelProps {
  /** DIRECT mode: POST straight to /api/import for this existing merchant. */
  merchantId?: string;
  /** STAGING mode: hand the mapped rows up to the wizard instead of POSTing. */
  onStage?: (rows: MappedRow[], format: ImportFormat, fileName: string) => void;
}

interface Counts {
  customersCreated: number;
  ordersCreated: number;
  skipped: number;
  /** rows with no parseable pledge/order date — defaulted to import time. */
  datelessRows?: number;
  /** rows with no parseable pledge amount — defaulted to the $50 floor. */
  unparseableMoneyRows?: number;
}

const FORMAT_LABEL: Record<ImportFormat, string> = {
  kickstarter: "Kickstarter backer report",
  backerkit: "BackerKit export",
  unknown: "unrecognized headers — mapping best-effort as Kickstarter",
};

function dollars(cents?: number): string {
  if (cents === undefined) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export function ImportPanel({ merchantId, onStage }: ImportPanelProps) {
  const staging = typeof onStage === "function";
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [format, setFormat] = useState<ImportFormat | null>(null);
  const [mapped, setMapped] = useState<MappedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setCounts(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text(); // parsed locally — the file stays on-device
      const { format: fmt, rows } = mapRows(parseCsv(text));
      const withEmail = rows.filter((r) => r.email.trim() !== "");
      setFormat(fmt);
      setMapped(withEmail);
      if (withEmail.length === 0) {
        setError("No rows with an email address were found. Check the file and try again.");
      }
    } catch {
      setError("Could not read that file. Make sure it's a plain CSV export.");
      setMapped([]);
      setFormat(null);
    }
  }

  async function runAction() {
    if (mapped.length === 0) return;
    // STAGING mode: hand the parsed rows up to the wizard; nothing is sent yet —
    // they import atomically when the merchant clicks the final onboarding CTA.
    if (staging) {
      onStage!(mapped, format ?? "unknown", fileName ?? "");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ONLY the mapped rows leave the browser — never the raw file.
        body: JSON.stringify({ merchantId, rows: mapped }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as Counts;
      setCounts(data);
    } catch {
      setError("Something went wrong importing your list. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const preview = mapped.slice(0, 5);
  // Rows whose pledge amount didn't parse fall back to the $50 floor; surface the
  // count so a defaulted value is never mistaken for a real parsed one.
  const defaultedValueRows = mapped.filter((r) => r.orderValueCents === undefined).length;

  return (
    <div className={staging ? "mt-4 rounded-xl border border-border bg-sand p-5" : "panel mt-6 p-6"}>
      <p className="kicker mb-3">Import your backer list</p>
      <p className="mb-4 text-[14px] leading-relaxed text-slate">
        Upload the export you already hold &mdash; a Kickstarter backer report or a BackerKit CSV
        &mdash; to populate your customers and orders. No password, no store access.
      </p>
      <p className="mb-4 rounded-xl border border-border bg-paper p-3 text-[12.5px] leading-relaxed text-ink-mute">
        Your file is parsed <strong>in your browser</strong>. Only the mapped fields in the preview
        below leave your machine{staging ? " when you finish setup" : ""} &mdash; the raw CSV never
        does.
      </p>
      <p className="mb-4 rounded-xl border border-teal-300 bg-accent-card/60 p-3 text-[12.5px] leading-relaxed text-ink">
        Works with Kickstarter backer reports + BackerKit exports &mdash; needs at least: name,
        email, pledge amount, and a pledge/order <strong>date</strong> column so we can track each
        backer&rsquo;s real wait.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="hidden"
        aria-label="Backer list CSV"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => inputRef.current?.click()}>
          Choose CSV file
        </Button>
        {fileName ? <span className="text-[13px] text-ink-mute">{fileName}</span> : null}
      </div>

      {format === "unknown" ? (
        <p className="mt-4 rounded-lg border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] px-3 py-2 text-[13px] text-amber-status">
          {FORMAT_LABEL.unknown} &middot; {mapped.length} row{mapped.length === 1 ? "" : "s"} with an
          email. Double-check the preview below before importing.
        </p>
      ) : format ? (
        <p className="mt-4 text-[13px] text-slate">
          Detected: <strong className="text-ink">{FORMAT_LABEL[format]}</strong> &middot;{" "}
          {mapped.length} row{mapped.length === 1 ? "" : "s"} with an email
        </p>
      ) : null}

      {preview.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-sand text-left text-ink-mute">
                <th className="px-3 py-2 font-semibold">First name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Group</th>
                <th className="px-3 py-2 font-semibold">Pledge value</th>
                <th className="px-3 py-2 font-semibold">Disclosed ETA</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className="border-t border-border text-slate">
                  <td className="px-3 py-2">{r.firstName || "—"}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.group ?? "ks-backer"}</td>
                  <td className="px-3 py-2">
                    {r.orderValueCents !== undefined ? (
                      dollars(r.orderValueCents)
                    ) : (
                      <span className="text-ink-mute">
                        {dollars(DEFAULT_ORDER_VALUE_CENTS)}
                        <span className="ml-1.5 rounded bg-sand px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          default
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.disclosedEtaValue ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mapped.length > preview.length ? (
            <p className="border-t border-border px-3 py-2 text-[12px] text-ink-mute">
              + {mapped.length - preview.length} more row{mapped.length - preview.length === 1 ? "" : "s"} will import
            </p>
          ) : null}
          {defaultedValueRows > 0 ? (
            <p className="border-t border-border px-3 py-2 text-[12px] text-ink-mute">
              {defaultedValueRows} row{defaultedValueRows === 1 ? "" : "s"} had no parseable pledge
              amount and use the {dollars(DEFAULT_ORDER_VALUE_CENTS)} default (marked above) &mdash;
              correct these later from your cockpit.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-[13.5px] font-medium text-terracotta-600">{error}</p> : null}

      {counts ? (
        <div className="mt-5 flex flex-col gap-2">
          <p className="rounded-xl border border-teal-300 bg-accent-card/60 p-3 text-[14px] font-medium text-ink">
            {counts.customersCreated} customer{counts.customersCreated === 1 ? "" : "s"},{" "}
            {counts.ordersCreated} order{counts.ordersCreated === 1 ? "" : "s"} imported
            {counts.skipped ? ` · ${counts.skipped} row${counts.skipped === 1 ? "" : "s"} skipped (no email)` : ""}.
          </p>
          {counts.datelessRows ? (
            <p className="rounded-xl border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] p-3 text-[13px] text-amber-status">
              {counts.datelessRows} row{counts.datelessRows === 1 ? "" : "s"} had no readable date
              &mdash; those backers default to today; check your export has a pledge-date column.
            </p>
          ) : null}
          {counts.unparseableMoneyRows ? (
            <p className="rounded-xl border border-[rgba(138,102,18,0.3)] bg-[rgba(138,102,18,0.08)] p-3 text-[13px] text-amber-status">
              {counts.unparseableMoneyRows} row{counts.unparseableMoneyRows === 1 ? "" : "s"} had no
              readable pledge amount.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5">
          <Button onClick={runAction} disabled={importing || mapped.length === 0}>
            {staging
              ? `Stage ${mapped.length || ""} backer${mapped.length === 1 ? "" : "s"} for import`.trim()
              : importing
                ? "Importing…"
                : `Import ${mapped.length || ""} backer${mapped.length === 1 ? "" : "s"}`.trim()}
          </Button>
        </div>
      )}
    </div>
  );
}
