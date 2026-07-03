"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea } from "@/components/ui/Field";

/**
 * Workshop update composer (ADR-0009, task U2). Posts one merchant update — it
 * fans out to every waiting backer's status page — and lists the recent feed.
 * Each posted update can be rendered as a Kickstarter-formatted DRAFT with a
 * copy button; the operator pastes it into Kickstarter themselves (never
 * auto-posted). The KS draft string is built server-side and passed in as
 * `ksDraft`, so the format lives in one pure place.
 */
export interface ComposerUpdate {
  id: string;
  text: string;
  imageUrl?: string;
  stamp: string;
  hidden: boolean;
  ksDraft: string;
}

export function UpdateComposer({
  merchantId,
  updates,
}: {
  merchantId: string;
  updates: ComposerUpdate[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openDraftId, setOpenDraftId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body: { merchantId: string; text: string; imageUrl?: string } = {
        merchantId,
        text: text.trim(),
      };
      const url = imageUrl.trim();
      if (url) body.imageUrl = url;

      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong posting that update.");
        return;
      }
      setText("");
      setImageUrl("");
      setNotice("Posted. Every waiting backer's status page now shows it.");
      router.refresh();
    } catch {
      setError("Network error posting that update.");
    } finally {
      setBusy(false);
    }
  }

  async function copyDraft(u: ComposerUpdate) {
    setOpenDraftId((cur) => (cur === u.id ? cur : u.id));
    try {
      await navigator.clipboard.writeText(u.ksDraft);
      setCopiedId(u.id);
      setTimeout(() => setCopiedId((cur) => (cur === u.id ? null : cur)), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions): the draft is still
      // revealed below for manual select-and-copy.
      setOpenDraftId(u.id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* composer */}
      <form onSubmit={submit} className="panel flex flex-col gap-4 p-5 md:p-6">
        <Field
          label="What's happening in the workshop?"
          hint="A short, plain note — progress, a photo from the bench, a supplier swap. No hard ship dates."
        >
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tooling is finalized and the first samples cleared our bench test this week…"
            maxLength={2000}
          />
        </Field>

        <Field label="Image URL (optional)" hint="An externally-hosted image link. Rendered at full width; nothing is uploaded.">
          <TextInput
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
          />
        </Field>

        {error ? (
          <p className="rounded-lg border border-risk-red/30 bg-[rgba(192,70,59,0.08)] px-3.5 py-2.5 text-[13px] text-risk-red">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg border border-risk-green/30 bg-[rgba(62,142,110,0.08)] px-3.5 py-2.5 text-[13px] text-risk-green">
            {notice}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || text.trim().length === 0}>
            {busy ? "Posting…" : "Post update"}
          </Button>
          <span className="text-[12px] text-ink-mute">Fans out to every status page instantly.</span>
        </div>
      </form>

      {/* recent feed */}
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-ink">
          Recent updates{updates.length ? ` (${updates.length})` : ""}
        </p>

        {updates.length === 0 ? (
          <div className="proof-placeholder">No updates yet — post your first one above.</div>
        ) : (
          updates.map((u) => (
            <article
              key={u.id}
              className={clsx("panel p-4", u.hidden && "opacity-60")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-line break-words text-[14px] leading-relaxed text-slate">{u.text}</p>
                {u.hidden ? (
                  <span className="pill shrink-0 border-border text-ink-mute">Hidden</span>
                ) : null}
              </div>

              {u.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.imageUrl}
                  alt="Workshop update"
                  loading="lazy"
                  className="mt-3 block w-full max-w-[420px] rounded-lg border border-border object-cover"
                />
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-ink-mute">{u.stamp}</span>
                <button
                  type="button"
                  onClick={() => copyDraft(u)}
                  className="link-quiet text-[13px]"
                >
                  {copiedId === u.id ? "Copied to clipboard" : "Copy as Kickstarter update"}
                </button>
              </div>

              {openDraftId === u.id ? (
                <div className="mt-3 rounded-lg border border-border bg-sand p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal">
                      Kickstarter update — draft
                    </span>
                    <span className="text-[11px] text-ink-mute">Draft only — paste it yourself</span>
                  </div>
                  <textarea
                    readOnly
                    value={u.ksDraft}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-h-[140px] w-full resize-y rounded-md border border-border bg-paper p-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none"
                  />
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
