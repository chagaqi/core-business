/**
 * DNS preload for the mongo utility scripts (seed:mongo, smoke:mongo).
 *
 * This machine's local DNS proxy (127.0.0.1) refuses the SRV/TXT lookups
 * Node's c-ares resolver issues for mongodb+srv:// URIs, even though the OS
 * resolver handles them fine. Pointing dns.setServers at public resolvers
 * fixes the lookups, and doing it in a --import preload scopes the override
 * to these utility scripts only — the app and everything else keep the
 * system resolver. Vercel is unaffected (its resolvers handle SRV fine).
 *
 * Use: node --env-file-if-exists=.env.local --import ./scripts/local-dns.mjs <script>
 */
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
