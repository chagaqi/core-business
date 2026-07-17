/**
 * Minimal outbound email, sent the same way the inbound path already talks to
 * Resend (lib/inbound.ts): a raw fetch with RESEND_API_KEY — no SDK, no new
 * dependency. This is the one sender for every transactional message Tideover
 * owes an ACCOUNT OWNER (trial reminders now; billing receipts later). It is NOT
 * for customer-facing reply delivery — that rides the helpdesk relays (ADR-0021).
 *
 * FAIL SOFT, ALWAYS. A caller (the daily cron) sends in a loop over many
 * merchants; a missing key or one bad send must never throw and sink the batch.
 * Unconfigured or failed → a `{ sent: false, reason }` result the caller logs.
 */

export interface SendResult {
  sent: boolean;
  id?: string;
  /** why nothing went out — "not-configured" (no key/from) or "send-failed:<detail>". */
  reason?: string;
}

/** Tideover's brand-wrapped HTML shell. Inline styles only (email clients strip <style>). */
export function renderEmailShell(bodyHtml: string, opts: { preheader?: string } = {}): string {
  const preheader = opts.preheader
    ? `<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${opts.preheader}</span>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#FBF8F2;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#11252A">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #E9E2D6;border-radius:14px;overflow:hidden">
<tr><td style="padding:22px 30px 0"><span style="font-size:17px;font-weight:700;color:#0E5366;letter-spacing:-.01em">Tideover</span></td></tr>
<tr><td style="padding:16px 30px 28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
</table>
<div style="max-width:520px;padding:14px 8px 0;color:#7C8A8E;font-size:12px;line-height:1.5">You're receiving this because you started a Tideover account. Manage or cancel any time from your dashboard.</div>
</td></tr></table>
</body></html>`;
}

/**
 * Send one transactional email. Returns a result rather than throwing so a batch
 * caller keeps going. No-ops (sent:false, reason:"not-configured") when
 * RESEND_API_KEY or EMAIL_FROM is unset — the local/dev/unprovisioned case.
 */
export async function sendEmail(msg: { to: string; subject: string; html: string }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { sent: false, reason: "not-configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) return { sent: false, reason: `send-failed:${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err) {
    return { sent: false, reason: `send-failed:${err instanceof Error ? err.message : String(err)}` };
  }
}
