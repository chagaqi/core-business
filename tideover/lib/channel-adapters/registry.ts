import type { Channel } from "@/lib/types";
import type { ChannelAdapter } from "@/lib/channel-adapters/ChannelAdapter";
import { MockAdapter } from "@/lib/channel-adapters/MockAdapter";
import { GorgiasAdapter } from "@/lib/channel-adapters/GorgiasAdapter";
import { TidioAdapter } from "@/lib/channel-adapters/TidioAdapter";
import { IntercomAdapter } from "@/lib/channel-adapters/IntercomAdapter";
import { EmailAdapter } from "@/lib/channel-adapters/EmailAdapter";

/**
 * Adapter registry. Resolves a Channel to its adapter. The demo always operates
 * the MockAdapter for sending (native surface), while normalizeInbound/verify on
 * the real adapters document the bolt-on contract.
 */
const ADAPTERS: Record<Channel, ChannelAdapter> = {
  mock: new MockAdapter(),
  gorgias: new GorgiasAdapter(),
  tidio: new TidioAdapter(),
  intercom: new IntercomAdapter(),
  email: new EmailAdapter(),
};

export function getAdapter(channel: Channel): ChannelAdapter {
  return ADAPTERS[channel] ?? ADAPTERS.mock;
}

/**
 * In the seeded demo, outbound send always succeeds through the MockAdapter even
 * if a ticket's source channel is a (stubbed) real helpdesk — this lets the full
 * approve→send flow be demonstrated end-to-end without live vendor credentials.
 */
export function getSendAdapter(channel: Channel): ChannelAdapter {
  const real = getAdapter(channel);
  if (real.name === "mock") return real;
  return process.env.DEMO_FORCE_MOCK_SEND === "false" ? real : ADAPTERS.mock;
}
