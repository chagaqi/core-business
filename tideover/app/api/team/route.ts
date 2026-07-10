import { handleTeamDELETE, handleTeamPOST } from "@/lib/team-route";
import { withApiErrorHandling } from "@/lib/api-handler";

/**
 * POST/DELETE /api/team — owner-only seat management (seats capability).
 * Thin wrapper: all logic lives in lib/team-route.ts so it is unit-testable
 * without the Next runtime. Gated by the middleware matcher (auth required;
 * tenant-scope marker stamped), and additionally owner-checked inside.
 */
export const dynamic = "force-dynamic";

export const POST = withApiErrorHandling("/api/team", handleTeamPOST);
export const DELETE = withApiErrorHandling("/api/team", handleTeamDELETE);
