# Labels & issue conventions (task OS6)

The canonical task board is `mission-control/tideover-hq.html` (the TASKS array). These GitHub labels mirror it so issues/PRs stay consistent with the board. Creating them needs the `gh` CLI, which isn't installed in the autonomous environment — so the commands are here for you to run once.

## One-time setup (your machine)

```
winget install --id GitHub.cli        # or: brew install gh  (macOS)
gh auth login                          # pick GitHub.com → this repo (chagaqi/core-business)
```

## Create the label set

Run from the repo root (idempotent — re-run to update colors/descriptions):

```bash
# area — mirrors the board categories
gh label create "area:found"    -c "1D4ED8" -d "foundation / infra / ops" --force
gh label create "area:engine"   -c "7C3AED" -d "reassurance/risk/gift engines + eval harness" --force
gh label create "area:cockpit"  -c "0E7490" -d "operator app: inbox, dashboard, draft rail" --force
gh label create "area:customer" -c "0E5366" -d "status page, widget, onboarding" --force
gh label create "area:money"    -c "047857" -d "dispute/GMV/baseline surfaces" --force
gh label create "area:gtm"      -c "D9762F" -d "marketing, pricing, outreach copy" --force
gh label create "area:trust"    -c "B45309" -d "security, privacy, procurement" --force

# priority — P1 before P2 before P3 (matches the board)
gh label create "p1" -c "B91C1C" -d "must-ship" --force
gh label create "p2" -c "D97706" -d "should-ship" --force
gh label create "p3" -c "65A30D" -d "polish / nice-to-have" --force

# flags
gh label create "needs:dylan"  -c "FBBF24" -d "blocked on a founder decision (pricing/legal/copy/creds)" --force
gh label create "proof-only"   -c "0E5366" -d "touches proof-only-sensitive copy or metrics — review hard" --force
gh label create "hot-file"     -c "DC2626" -d "touches a serialized cockpit/engine hot file" --force
gh label create "cut"          -c "6B7280" -d "deliberately out of scope — see the cut list" --force
```

## Convert the standing cut list to tracked issues (optional)

Documents *why* each cut exists so it isn't silently re-litigated. The list + rationale is in `docs/TIDEOVER-SPRINT-PLAN.md` ("Standing cut list"). Example:

```bash
gh issue create -t "CUT: bandit/epsilon selection" -l cut,area:engine \
  -b "Deferred — no customers; variant slots need months to reach n≥20. Ship ledger + stats panel only; selection is post-first-cohort. See docs/TIDEOVER-SPRINT-PLAN.md."
gh issue create -t "CUT: SOC 2 / enterprise questionnaires" -l cut,area:trust \
  -b "Deferred — \$25–50K; qualify out. The /security data-map + /procurement packet are the honest answer. See the cut list."
# …one per row of the cut list.
```

Then close them immediately (they're documentation, not work): `gh issue close <n> -c "Documented cut; not planned."` — or leave them open under the `cut` label as a visible register.
