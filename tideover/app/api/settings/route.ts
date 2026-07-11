import { handleSettingsPATCH } from "@/lib/settings-route";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * PATCH /api/settings — owner-only, per-section merchant settings (brand voice,
 * wait window, production stages, gift catalog). Thin wrapper: all logic lives
 * in lib/settings-route.ts so it is unit-testable without the Next runtime.
 * Gated by the middleware matcher (auth required; tenant-scope marker stamped),
 * and additionally owner-checked + demo-guarded inside.
 */
export const dynamic = "force-dynamic";

export const PATCH = withApiErrorHandling("/api/settings", handleSettingsPATCH);
