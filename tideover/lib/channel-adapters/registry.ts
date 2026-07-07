import type { Channel } from "@/lib/types";
import type { ChannelAdapter } from "@/lib/channel-adapters/ChannelAdapter";
import { MockAdapter } from "@/lib/channel-adapters/MockAdapter";
import { GorgiasAdapter } from "@/lib/channel-adapters/GorgiasAdapter";
import { TidioAdapter } from "@/lib/channel-adapters/TidioAdapter";
import { IntercomAdapter } from "@/lib/channel-adapters/IntercomAdapter";
import { EmailAdapter } from "@/lib/channel-adapters/EmailAdapter";
import { ManualAdapter } from "@/lib/channel-adapters/ManualAdapter";

/**
 * Adapter registry. Resolves a Channel to its adapter. The demo always operates
 * the MockAdapter for sending (native surface), while normalizeInbound/verify on
 * the real adapters document the bolt-on contract. `manual` is the honest send
 * strategy for a real merchant with no write-back integration yet.
 */
const ADAPTERS: Record<Channel, ChannelAdapter> = {
  mock: new MockAdapter(),
  gorgias: new GorgiasAdapter(),
  tidio: new TidioAdapter(),
  intercom: new IntercomAdapter(),
  email: new EmailAdapter(),
  manual: new ManualAdapter(),
};

export function getAdapter(channel: Channel): ChannelAdapter {
  return ADAPTERS[channel] ?? ADAPTERS.mock;
}

/**
 * Resolve the adapter that actually delivers a reply.
 *
 * - Demo merchants keep the working MockAdapter: the seeded walk simulates a send
 *   end-to-end with no vendor credentials, so the demo is unchanged.
 * - A real merchant on a real helpdesk channel routes to the ManualAdapter — an
 *   honest record of the reply the operator copies and pastes in themselves,
 *   until a true write-back integration ships. (The real channel adapters still
 *   throw NotImplementedError on send; they document the future bolt-on.)
 * - A real merchant already on the native `mock` channel keeps the MockAdapter.
 */
export function getSendAdapter(channel: Channel, isDemo: boolean): ChannelAdapter {
  if (isDemo) return ADAPTERS.mock;
  const real = getAdapter(channel);
  if (real.name === "mock") return real;
  return ADAPTERS.manual;
}
