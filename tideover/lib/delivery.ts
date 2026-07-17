import { sendEmail } from "@/lib/email";

/**
 * THE DELIVERER SEAM (ADR-0022 / send-seam). Every backer-facing message — the
 * status link at import, a cohort update on a status-board post — goes through a
 * Deliverer, so the product can either SEND it (EmailDeliverer, Resend) or stay
 * on the manual paste (NoopDeliverer) without the callers knowing which.
 *
 * TWO RULES, both load-bearing:
 *   1. Auto-send is OPT-IN. getDeliverer() returns Noop unless DELIVERY_MODE=email
 *      AND a sender is configured — nothing blasts a backer list by accident.
 *   2. Never fabricate a receipt. Noop returns delivered:false, channel:"manual".
 *      A copied-by-hand reply is "Copied", never "Delivered" — the caller records
 *      exactly what the result says, no more.
 *
 * Every real send carries a one-click unsubscribe (RFC 8058 List-Unsubscribe) and
 * a footer link — CAN-SPAM/GDPR arrive with the first email. The unsubscribe URL
 * is supplied by the caller (it owns the token + suppression); this seam only
 * transmits it.
 */

export interface DeliveryMessage {
  /** backer email. */
  to: string;
  subject: string;
  html: string;
  /** absolute unsubscribe URL — becomes the List-Unsubscribe header + a footer link. */
  unsubscribeUrl: string;
}

export interface DeliveryResult {
  delivered: boolean;
  channel: "email" | "manual";
  /** provider message id on a real send. */
  id?: string;
  /** why nothing was sent — "manual-send", "not-configured", "send-failed:*". */
  reason?: string;
}

export interface Deliverer {
  readonly kind: "email" | "noop";
  deliver(msg: DeliveryMessage): Promise<DeliveryResult>;
}

const unsubFooter = (url: string) =>
  `<p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#9aa6a8">You're receiving this because you backed a campaign that uses Tideover to keep you posted. <a href="${url}" style="color:#6b7a7c">Unsubscribe</a>.</p>`;

/** Sends the message via Resend with a one-click unsubscribe. */
export class EmailDeliverer implements Deliverer {
  readonly kind = "email" as const;
  async deliver(msg: DeliveryMessage): Promise<DeliveryResult> {
    const r = await sendEmail({
      to: msg.to,
      subject: msg.subject,
      html: msg.html + unsubFooter(msg.unsubscribeUrl),
      headers: {
        "List-Unsubscribe": `<${msg.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return r.sent ? { delivered: true, channel: "email", id: r.id } : { delivered: false, channel: "email", reason: r.reason };
  }
}

/** The default: nothing is sent — the operator copies by hand. Never claims delivery. */
export class NoopDeliverer implements Deliverer {
  readonly kind = "noop" as const;
  async deliver(): Promise<DeliveryResult> {
    return { delivered: false, channel: "manual", reason: "manual-send" };
  }
}

/**
 * Select the deliverer. Auto-send to backers is off until a merchant explicitly
 * enables it with a verified sending domain (DELIVERY_MODE=email + RESEND_API_KEY
 * + EMAIL_FROM). Anything else → Noop, the safe manual default.
 */
export function getDeliverer(): Deliverer {
  if (process.env.DELIVERY_MODE === "email" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    return new EmailDeliverer();
  }
  return new NoopDeliverer();
}
