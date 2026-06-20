/* Mission Control — application logic.
   Pure vanilla JS, no modules, no fetch. Reads window.MC_DATA, renders the six
   #view-* containers, wires all interactivity in the build contract.
   Must run with zero console errors on file:// even if fields are missing. */
(function () {
  "use strict";

  /* ============================================================= *
   *  0. SAFE GLOBALS                                              *
   * ============================================================= */
  var MC = (window.MC_DATA && typeof window.MC_DATA === "object") ? window.MC_DATA : {};
  var META = MC.meta || {};
  var VENTURES = MC.ventures || {};
  var V1 = VENTURES.v1 || {};
  var V2 = VENTURES.v2 || {};
  var CAD = MC.cadence || {};
  var KPIS = arr(MC.kpis);
  var FRAMEWORKS = arr(MC.frameworks);
  var SPRINT = (MC.sprint && typeof MC.sprint === "object") ? MC.sprint : {};
  var DELIVERABLES = arr(MC.deliverables);

  /* DAY0 is the EXECUTION day-0 (the 90-day clock). The 3-day GTM Build Sprint
     runs on calendar days before it; sprintStart anchors the sprint clock. */
  var DAY0 = META.day0 || "2026-06-17";
  var SPRINT_START = META.sprintStart || SPRINT.start || "2026-06-14";
  var SPRINT_DAYS = arr(SPRINT.days).length || 3;
  var DAY90 = META.day90 || "2026-09-15";
  var TOTAL_DAYS = 90;

  /* localStorage key prefix */
  var P = "mc:";

  /* ============================================================= *
   *  1. SMALL HELPERS                                             *
   * ============================================================= */
  function arr(x) { return Array.isArray(x) ? x : []; }
  function obj(x) { return (x && typeof x === "object") ? x : {}; }
  function str(x) { return (x === null || x === undefined) ? "" : String(x); }
  function num(x, d) { var n = Number(x); return isFinite(n) ? n : (d || 0); }

  function escapeHtml(s) {
    s = str(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slug(s) {
    return str(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "x";
  }

  /* localStorage, all guarded */
  function lsGet(key, fallback) {
    try {
      var v = window.localStorage.getItem(P + key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { window.localStorage.setItem(P + key, str(val)); } catch (e) {}
  }
  function lsGetJSON(key, fallback) {
    try {
      var v = window.localStorage.getItem(P + key);
      if (v === null) return fallback;
      return JSON.parse(v);
    } catch (e) { return fallback; }
  }

  function el(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* date helpers (local, ms-based) */
  function todayISO() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }
  function dateLabel(iso) {
    var s = str(iso);
    var d;
    /* bare YYYY-MM-DD -> construct as LOCAL midnight so the weekday/day don't
       shift in negative-UTC-offset timezones (Date.parse treats it as UTC). */
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      d = new Date(num(m[1]), num(m[2]) - 1, num(m[3]));
    } else {
      var t = Date.parse(s);
      if (!isFinite(t)) return s; // already a formatted label like "Wed Jun 17"
      d = new Date(t);
    }
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[d.getDay()] + " " + mon[d.getMonth()] + " " + d.getDate();
  }
  function daysBetween(fromISO, toMs) {
    var s = str(fromISO);
    var f;
    /* parse bare YYYY-MM-DD as LOCAL midnight so day boundaries align to the
       user's local calendar (Date.parse would treat it as UTC). */
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      f = new Date(num(m[1]), num(m[2]) - 1, num(m[3])).getTime();
    } else {
      f = Date.parse(s);
    }
    if (!isFinite(f)) return 0;
    return Math.floor(((toMs === undefined ? Date.now() : toMs) - f) / 86400000);
  }

  /* engine -> accent class */
  function engineClass(engine) {
    var e = str(engine).toUpperCase();
    if (e === "V1") return "accent-v1";
    if (e === "V2") return "accent-v2";
    return "accent-both";
  }
  function engineLabel(engine) {
    var e = str(engine).toUpperCase();
    if (e === "V1") return "V1";
    if (e === "V2") return "V2";
    if (e === "BOTH" || e === "SHARED") return e === "BOTH" ? "BOTH" : "SHARED";
    return e || "—";
  }

  /* tag -> css class */
  function tagClass(tag) {
    var t = str(tag).toUpperCase();
    if (t.indexOf("AGENT+REVIEW") !== -1 || t.indexOf("AGENT + REVIEW") !== -1) return "tag-review";
    if (t.indexOf("AGENT") !== -1) return "tag-agent";
    if (t.indexOf("HUMAN") !== -1) return "tag-human";
    return "";
  }

  /* ============================================================= *
   *  2. TODAY / PHASE COMPUTATION                                *
   * ============================================================= */
  function computeDayN() {
    var n = daysBetween(DAY0, Date.now());
    if (n < 0) n = 0;
    return n;
  }

  /* Sprint clock: 1-indexed day within the GTM Build Sprint (Day 1 = sprintStart).
     Returns 0 if before the sprint, >SPRINT_DAYS if after it. */
  function computeSprintDay() {
    var n = daysBetween(SPRINT_START, Date.now());
    if (n < 0) return 0;
    return n + 1;
  }
  /* True while "now" is on/before the last sprint day AND before execution day-0. */
  function inSprintWindow() {
    var sd = computeSprintDay();
    if (sd < 1 || sd > SPRINT_DAYS) return false;
    return daysBetween(DAY0, Date.now()) < 0;
  }
  /* The sprint day object for a given 1-indexed day, or null. */
  function sprintDayObj(dayNum) {
    var days = arr(SPRINT.days);
    for (var i = 0; i < days.length; i++) {
      if (num(days[i].day, i + 1) === dayNum) return days[i];
    }
    return days[dayNum - 1] || null;
  }
  /* Count incomplete checklist items for a sprint day (for the status strip). */
  function sprintItemsLeft(dayObj) {
    if (!dayObj) return 0;
    var items = arr(dayObj.items);
    var dayISO = todayISO();
    var left = 0;
    items.forEach(function (it, i) {
      var id = sprintItemId(dayObj, i);
      /* A deliverable-gated item that isn't approved counts as not-done,
         regardless of any stale stored checked state. */
      var deliv = (it && typeof it === "object") ? it.deliv : "";
      var gated = !!deliv && !delivApproved(deliv);
      if (gated || !isChecked(id, dayISO)) left++;
    });
    return left;
  }
  /* Stable id for a sprint checklist item. */
  function sprintItemId(dayObj, idx) {
    return "sprint-d" + num(dayObj.day, 0) + "-" + idx;
  }

  /* fixed canonical phase day-ranges per the contract */
  var PHASE_RANGES = [
    { from: 0, to: 14 },
    { from: 14, to: 35 },
    { from: 35, to: 60 },
    { from: 60, to: 90 }
  ];

  function currentPhaseIndex(dayN) {
    var phases = arr(CAD.phases);
    if (!phases.length) return -1;
    for (var i = 0; i < PHASE_RANGES.length && i < phases.length; i++) {
      var r = PHASE_RANGES[i];
      var last = (i === PHASE_RANGES.length - 1);
      if (dayN >= r.from && (dayN < r.to || (last && dayN >= r.to))) return i;
    }
    // dayN beyond mapped ranges -> last phase
    return Math.min(phases.length - 1, PHASE_RANGES.length - 1);
  }

  function pctOnly(s) {
    // pull a "NN%" out of a share string like "~85% (...)"
    var m = str(s).match(/(\d+)\s*%/);
    return m ? m[1] : str(s);
  }

  /* ============================================================= *
   *  3. CHECKLIST ENGINE (per-day persisted)                     *
   * ============================================================= */
  /* state key: mc:check:<YYYY-MM-DD>:<stableId>  -> "1" | absent */
  function checkKey(stableId, dayISO) {
    return "check:" + (dayISO || todayISO()) + ":" + stableId;
  }
  function isChecked(stableId, dayISO) {
    return lsGet(checkKey(stableId, dayISO), null) === "1";
  }
  function setChecked(stableId, on, dayISO) {
    var k = checkKey(stableId, dayISO);
    if (on) lsSet(k, "1");
    else { try { window.localStorage.removeItem(P + k); } catch (e) {} }
  }

  /* Render a checklist section.
     items: array of {id, label, sub?, tag?, accent?}
     groupId: stable prefix for the reset button / progress wiring. */
  function renderChecklist(groupId, title, items, opts) {
    opts = opts || {};
    var dayISO = todayISO();
    var done = 0;
    var rows = items.map(function (it) {
      /* Deliverable gating: if this item depends on a deliverable that is not
         yet approved, lock the checkbox so it can't be toggled or persisted. */
      var dlv = it.deliv ? delivById(it.deliv) : null;
      var gated = !!(it.deliv) && !delivApproved(it.deliv);

      var on = !gated && isChecked(it.id, dayISO);
      if (on) done++;
      var tagHtml = it.tag ? '<span class="tag ' + tagClass(it.tag) + '">' + escapeHtml(it.tag) + "</span>" : "";
      var subHtml = it.sub ? '<div class="muted check-sub">' + escapeHtml(it.sub) + "</div>" : "";
      var accent = it.accent ? " " + it.accent : "";

      if (gated) {
        var dTitle = dlv ? str(dlv.title) : str(it.deliv);
        var tip = "Approve '" + dTitle + "' in the Deliverables tab to unlock";
        var lockHtml = '<span class="check-lock" title="' + escapeHtml(tip) + '">🔒</span>';
        var gateNote = '<div class="muted check-gate">Locked — approve <b>' + escapeHtml(dTitle) + "</b> in the Deliverables tab</div>";
        return (
          '<label class="check locked' + accent + '" data-check="' + escapeHtml(it.id) + '" title="' + escapeHtml(tip) + '">' +
            '<input type="checkbox" disabled data-check-locked="' + escapeHtml(it.id) + '">' +
            '<span class="check-body">' +
              '<span class="check-line">' + escapeHtml(it.label) + " " + tagHtml + " " + lockHtml + "</span>" +
              subHtml + gateNote +
            "</span>" +
          "</label>"
        );
      }

      return (
        '<label class="check' + (on ? " checked" : "") + accent + '" data-check="' + escapeHtml(it.id) + '">' +
          '<input type="checkbox" ' + (on ? "checked" : "") + ' data-check-input="' + escapeHtml(it.id) + '">' +
          '<span class="check-body">' +
            '<span class="check-line">' + escapeHtml(it.label) + " " + tagHtml + "</span>" +
            subHtml +
          "</span>" +
        "</label>"
      );
    }).join("");

    var total = items.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var head = title
      ? '<div class="row check-head"><div class="section-title">' + escapeHtml(title) + "</div>" +
        '<button class="btn btn-reset" data-reset-group="' + escapeHtml(groupId) + '">Reset today</button></div>'
      : '<div class="row check-head"><span class="spacer"></span>' +
        '<button class="btn btn-reset" data-reset-group="' + escapeHtml(groupId) + '">Reset today</button></div>';

    return (
      '<div class="checklist" data-group="' + escapeHtml(groupId) + '">' +
        head +
        '<div class="progress" title="' + done + " / " + total + '"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
        '<div class="muted progress-label">' + done + " / " + total + " done · " + pct + "%</div>" +
        rows +
      "</div>"
    );
  }

  /* Recompute a single checklist's progress bar in place (no full re-render). */
  function refreshChecklistProgress(groupNode) {
    if (!groupNode) return;
    /* total = every check row (incl. locked) to match the initial render;
       done = only toggleable, checked boxes (locked rows can never be done). */
    var total = qsa(".check", groupNode).length;
    var done = 0;
    qsa("[data-check-input]", groupNode).forEach(function (b) { if (b.checked) done++; });
    var pct = total ? Math.round((done / total) * 100) : 0;
    var bar = groupNode.querySelector(".progress-bar");
    if (bar) bar.style.width = pct + "%";
    var lbl = groupNode.querySelector(".progress-label");
    if (lbl) lbl.textContent = done + " / " + total + " done · " + pct + "%";
    var prog = groupNode.querySelector(".progress");
    if (prog) prog.setAttribute("title", done + " / " + total);
  }

  /* ============================================================= *
   *  3b. DELIVERABLES: APPROVAL + GATING STATE                   *
   * ============================================================= */
  /* state key: mc:deliv:<id> -> JSON {status:"approved"|"denied", notes:""} */
  function delivKey(id) { return "deliv:" + str(id); }

  /* Read the stored record for a deliverable, always an object. */
  function delivRecord(id) {
    var rec = lsGetJSON(delivKey(id), null);
    if (!rec || typeof rec !== "object") return { status: "", notes: "" };
    return {
      status: str(rec.status),
      notes: str(rec.notes)
    };
  }
  function delivSet(id, status, notes) {
    lsSet(delivKey(id), JSON.stringify({ status: str(status), notes: str(notes) }));
  }
  function delivClear(id) {
    try { window.localStorage.removeItem(P + delivKey(id)); } catch (e) {}
  }
  function delivApproved(id) {
    return delivRecord(id).status === "approved";
  }

  /* Deliverables sorted by .order ascending (defensive on missing order).
     Tie-break on original array index so the order is a STABLE TOTAL order even
     if two items share (or lack) an .order — the progressive-unlock prefix needs
     a single unambiguous "first non-approved" candidate. */
  function delivList() {
    return DELIVERABLES.map(function (d, i) { return { d: d, i: i }; })
      .sort(function (a, b) {
        var da = num(a.d && a.d.order, 99), db = num(b.d && b.d.order, 99);
        return da !== db ? da - db : a.i - b.i;
      })
      .map(function (x) { return x.d; });
  }

  /* Derived state for one deliverable given the full ordered list + index. */
  function delivState(item, sorted, idx) {
    var rec = delivRecord(item.id);
    var approved = rec.status === "approved";
    /* UNLOCK-ALL (2026-06-19, per Chaga): all deliverables are unlocked at once —
       no sequential prefix gating — so any can be reviewed/approved in any order
       (he was trapped behind the VSL deliverable). Flip SEQUENTIAL_UNLOCK back to
       true to restore the original progressive-unlock behavior. */
    var SEQUENTIAL_UNLOCK = false;
    var unlocked = true;
    if (SEQUENTIAL_UNLOCK) {
      for (var i = 0; i < idx; i++) {
        if (!delivApproved(sorted[i].id)) { unlocked = false; break; }
      }
    }
    return {
      record: rec,
      approved: approved,
      unlocked: unlocked,
      active: unlocked && !approved,
      locked: !unlocked,
      denied: rec.status === "denied"
    };
  }

  /* The single active (unlocked, not-yet-approved) deliverable, or null. */
  function activeDeliverable() {
    var sorted = delivList();
    for (var i = 0; i < sorted.length; i++) {
      var st = delivState(sorted[i], sorted, i);
      if (st.active) return sorted[i];
    }
    return null;
  }

  /* Count of approved deliverables. */
  function delivApprovedCount() {
    var n = 0;
    DELIVERABLES.forEach(function (d) { if (d && delivApproved(d.id)) n++; });
    return n;
  }

  /* Look up a deliverable by id (for checkbox-gating labels). */
  function delivById(id) {
    for (var i = 0; i < DELIVERABLES.length; i++) {
      if (DELIVERABLES[i] && str(DELIVERABLES[i].id) === str(id)) return DELIVERABLES[i];
    }
    return null;
  }

  /* ============================================================= *
   *  4. SHARED SMALL RENDERERS                                   *
   * ============================================================= */
  function scoreRing(label, value, opts) {
    opts = opts || {};
    var v = num(value, 0);
    var lowerBetter = !!opts.lowerBetter;
    var quality = lowerBetter ? (10 - v) : v; // 0..10 where higher = greener
    var ringVar = quality >= 8 ? "--green" : (quality >= 5 ? "--amber" : "--red");
    return (
      '<div class="score">' +
        '<div class="score-ring" style="--val:' + v + ';--ring:var(' + ringVar + ')">' +
          "<span>" + escapeHtml(v) + "</span><small>/10</small>" +
        "</div>" +
        '<div class="score-label">' + escapeHtml(label) + (lowerBetter ? ' <span class="muted">(lower=better)</span>' : "") + "</div>" +
      "</div>"
    );
  }

  function badge(text, cls) {
    return '<span class="badge ' + (cls || "") + '">' + escapeHtml(text) + "</span>";
  }
  function pill(text, cls) {
    return '<span class="pill ' + (cls || "") + '">' + escapeHtml(text) + "</span>";
  }

  /* collapsible card: head toggles .open on body */
  var cardSeq = 0;
  function card(title, bodyHtml, opts) {
    opts = opts || {};
    cardSeq++;
    var open = opts.open !== false; // default open
    var accent = opts.accent ? " " + opts.accent : "";
    var headExtra = opts.headExtra || "";
    return (
      '<div class="card' + accent + '">' +
        '<div class="card-head" role="button" tabindex="0">' +
          '<span class="card-title">' + escapeHtml(title) + "</span>" +
          '<span class="card-head-extra">' + headExtra + '<span class="chev">' + (open ? "▾" : "▸") + "</span></span>" +
        "</div>" +
        '<div class="card-body collapsible' + (open ? " open" : "") + '">' + bodyHtml + "</div>" +
      "</div>"
    );
  }

  /* ============================================================= *
   *  4b. SPRINT VIEW (3-day GTM Build Sprint)                    *
   * ============================================================= */
  function sprintChecklistItems(dayObj) {
    return arr(dayObj.items).map(function (it, i) {
      var obj0 = (it && typeof it === "object") ? it : { text: str(it) };
      return {
        id: sprintItemId(dayObj, i),
        label: str(obj0.text),
        tag: obj0.tag || "",
        deliv: obj0.deliv || ""
      };
    });
  }

  function renderSprint() {
    var node = el("view-sprint");
    if (!node) return;

    var days = arr(SPRINT.days);
    if (!days.length) {
      node.innerHTML = '<div class="muted">No sprint data.</div>';
      return;
    }

    var sprintDay = computeSprintDay();
    var active = inSprintWindow();
    var html = "";

    /* hero strip */
    html += '<div class="sprint-hero">';
    html += '<div class="sprint-hero-top">';
    html += '<div class="sprint-title">3-Day GTM Build Sprint</div>';
    if (active) {
      html += '<span class="badge badge-now">Day ' + sprintDay + " of " + SPRINT_DAYS + "</span>";
    } else if (sprintDay > SPRINT_DAYS) {
      html += '<span class="badge">Complete — execution live</span>';
    } else {
      html += '<span class="badge">Starts ' + escapeHtml(dateLabel(SPRINT_START)) + "</span>";
    }
    html += "</div>";
    html += '<div class="muted sprint-sub">Days 1-3 of the ' + (META.programDays || 93) +
            "-day program · execution Day 0 = " + escapeHtml(dateLabel(DAY0)) +
            " (program Day 4), launched FULLY LOADED.</div>";
    if (SPRINT.note) html += '<div class="note sprint-note">' + escapeHtml(SPRINT.note) + "</div>";
    html += "</div>"; // sprint-hero

    /* per-day cards */
    days.forEach(function (d) {
      var dayNum = num(d.day, 0);
      var isToday = active && (sprintDay === dayNum);
      var items = sprintChecklistItems(d);
      var headExtra =
        '<span class="pill ' + (isToday ? "accent-both" : "pill-soft") + '">' +
        (d.date ? escapeHtml(dateLabel(d.date)) : "Day " + dayNum) + "</span> ";
      var title = "Day " + dayNum + " — " + str(d.theme);
      var body = renderChecklist("sprint-day-" + dayNum, "", items, {});
      html += card(title, body, {
        accent: "accent-both",
        open: true,
        headExtra: headExtra + (isToday ? badge("TODAY", "badge-now") + " " : "")
      });
    });

    node.innerHTML = html;
  }

  /* ============================================================= *
   *  4c. DELIVERABLES VIEW (approval + progressive unlock)       *
   * ============================================================= */
  function delivOpenLink(item, cls) {
    var p = str(item.path);
    if (!p) return "";
    /* Cache-buster: file:// HTML caching is stubborn and survives "clear cache"
       (the open tab keeps serving from memory). Rewrite the href to a unique URL
       on each click so the freshly-rendered doc always loads, never a stale copy. */
    return '<a class="' + (cls || "deliv-open") + '" href="' + escapeHtml(p) +
      '" target="_blank" rel="noopener" ' +
      'onclick="this.href=this.href.split(\'?\')[0]+\'?cb=\'+Date.now()">Open ↗</a>';
  }

  function delivCard(item, st) {
    var id = escapeHtml(str(item.id));
    var title = escapeHtml(str(item.title));

    /* LOCKED — minimized */
    if (st.locked) {
      return (
        '<div class="deliv-card deliv-locked" data-deliv="' + id + '">' +
          '<div class="deliv-row">' +
            '<span class="deliv-lock">🔒</span>' +
            '<span class="deliv-title">' + title + "</span>" +
          "</div>" +
          '<div class="muted deliv-locknote">Locked — finish the previous deliverable first</div>' +
        "</div>"
      );
    }

    /* APPROVED — condensed green */
    if (st.approved) {
      return (
        '<div class="deliv-card deliv-approved" data-deliv="' + id + '">' +
          '<div class="deliv-row">' +
            '<span class="deliv-check">✓</span>' +
            '<span class="deliv-title">' + title + "</span>" +
            '<span class="spacer"></span>' +
            delivOpenLink(item, "deliv-open deliv-open-sm") +
            '<a class="deliv-undo" href="#" data-deliv-undo="' + id + '">Undo</a>' +
          "</div>" +
        "</div>"
      );
    }

    /* ACTIVE (undecided or denied) — full card */
    var deniedBanner = st.denied
      ? '<div class="deliv-denied-banner">Denied — awaiting revision</div>'
      : "";
    var notesVal = escapeHtml(st.record.notes);
    var savedNotes = (st.denied && st.record.notes)
      ? '<div class="deliv-savednotes muted"><b>Revision notes:</b> ' + escapeHtml(st.record.notes) + "</div>"
      : "";

    return (
      '<div class="deliv-card deliv-active' + (st.denied ? " deliv-isdenied" : "") + '" data-deliv="' + id + '">' +
        deniedBanner +
        '<div class="deliv-row deliv-head-row">' +
          '<span class="deliv-dot"></span>' +
          '<span class="deliv-title">' + title + "</span>" +
          '<span class="spacer"></span>' +
          delivOpenLink(item, "deliv-open") +
        "</div>" +
        '<div class="muted deliv-what">' + escapeHtml(str(item.what)) + "</div>" +
        (item.unlocks ? '<div class="deliv-unlocks"><b>Unlocks:</b> <span class="muted">' + escapeHtml(str(item.unlocks)) + "</span></div>" : "") +
        savedNotes +
        '<textarea class="deliv-notes" data-deliv-notes="' + id + '" placeholder="Notes for revisions...">' + notesVal + "</textarea>" +
        '<div class="deliv-actions">' +
          '<button class="btn deliv-approve" data-deliv-approve="' + id + '">Approve</button>' +
          '<button class="btn deliv-deny" data-deliv-deny="' + id + '">Deny</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderDeliverables() {
    var node = el("view-deliverables");
    if (!node) return;

    var sorted = delivList();
    if (!sorted.length) {
      node.innerHTML = '<div class="muted">No deliverables.</div>';
      return;
    }

    var total = sorted.length;
    var approved = delivApprovedCount();
    var pct = total ? Math.round((approved / total) * 100) : 0;
    var active = activeDeliverable();

    var html = "";

    /* header + progress */
    html += '<div class="deliv-hero">';
    html += '<div class="deliv-hero-top">';
    html += '<div class="deliv-hero-title">Deliverables</div>';
    html += '<span class="badge badge-now">' + approved + " / " + total + " approved</span>";
    html += '<span class="spacer"></span>';
    html += '<button class="btn btn-sm deliv-copy-btn" data-deliv-copy="1" title="Copy your approve/deny decisions to hand to an assistant">⎘ Copy decisions</button>';
    html += '<button class="btn btn-sm deliv-dl-btn" data-deliv-download="1" title="Download your notes + decisions as a file Claude can read (saves to your Downloads)">⬇ Download notes</button>';
    html += "</div>";
    html += '<div class="muted deliv-hero-sub">All deliverables are open — review and approve them in any order. Approving one unlocks any gated Sprint checkboxes that depend on it. Deny with notes to send back for revision.</div>';
    html += '<div class="progress deliv-progress"><div class="progress-bar" style="width:' + pct + '%"></div></div>';
    html += '<div class="muted progress-label deliv-progress-label">' + approved + " / " + total + " approved · " + pct + "%</div>";
    if (active) {
      html += '<div class="deliv-nextline muted">Suggested next: <b>' + escapeHtml(str(active.title)) + "</b></div>";
    } else {
      html += '<div class="deliv-nextline deliv-alldone">All deliverables approved ✓</div>';
    }
    html += "</div>"; // deliv-hero

    /* export panel — populated/toggled by the "Copy decisions" button */
    html += '<div id="deliv-export" class="deliv-export" hidden>' +
              '<textarea id="deliv-export-ta" class="deliv-export-ta" readonly ' +
                'spellcheck="false" aria-label="Deliverable decisions export"></textarea>' +
              '<div id="deliv-export-hint" class="muted deliv-export-hint"></div>' +
            "</div>";

    /* group by .group, preserving order */
    var groups = [];
    var byGroup = {};
    sorted.forEach(function (item, idx) {
      var g = str(item.group) || "Deliverables";
      if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
      byGroup[g].push({ item: item, idx: idx });
    });

    groups.forEach(function (g) {
      html += '<div class="section-title mc-section">' + escapeHtml(g) + "</div>";
      html += '<div class="deliv-group">';
      byGroup[g].forEach(function (entry) {
        var st = delivState(entry.item, sorted, entry.idx);
        html += delivCard(entry.item, st);
      });
      html += "</div>";
    });

    node.innerHTML = html;
  }

  /* ============================================================= *
   *  5. MISSION VIEW (daily driver)                              *
   * ============================================================= */
  function milestoneChips(dayN) {
    var milestones = [
      { name: "Graduation", day: 14, date: "Jul 1" },
      { name: "First Cash", day: 35, date: "Jul 22" },
      { name: "Day 90", day: 90, date: "Sep 15" }
    ];
    return milestones.map(function (m) {
      var remaining = m.day - dayN;
      var reached = remaining <= 0;
      var cls = reached ? "past" : (remaining <= 7 ? "soon" : "");
      var bigNum = reached
        ? '<span class="cd-days">done <small>reached</small></span>'
        : '<span class="cd-days">' + remaining + ' <small>day' + (remaining === 1 ? "" : "s") + ' left</small></span>';
      return (
        '<div class="countdown ' + cls + '">' +
          '<span class="cd-label">' + escapeHtml(m.name) + "</span>" +
          bigNum +
          '<span class="cd-date">Day ' + m.day + " · " + escapeHtml(m.date) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function triageItems(dayN) {
    return arr(CAD.triage).slice().sort(function (a, b) {
      return num(a.rank, 99) - num(b.rank, 99);
    });
  }

  function hoursCutoff(hours) {
    switch (hours) {
      case "2h": return 3;
      case "4h": return 5;
      case "6h": return 6;
      default: return 99; // 8h+
    }
  }

  function renderTriageStack(dayN, hours) {
    var items = triageItems(dayN);
    var cutoff = hoursCutoff(hours);
    var rows = items.map(function (t) {
      var dim = num(t.rank, 99) > cutoff ? " dim" : "";
      var isTop = num(t.rank, 99) === 1;
      return (
        '<div class="triage-item ' + engineClass(t.engine) + dim + (isTop ? " triage-top" : "") + '">' +
          '<span class="triage-rank">' + escapeHtml(t.rank) + "</span>" +
          '<span class="triage-main">' +
            '<span class="triage-task">' + escapeHtml(t.task) + " " + pill(engineLabel(t.engine), engineClass(t.engine)) + "</span>" +
            '<span class="muted triage-why">' + escapeHtml(t.why) + "</span>" +
            (t.floor ? '<span class="triage-floor">floor: ' + escapeHtml(t.floor) + "</span>" : "") +
          "</span>" +
        "</div>"
      );
    }).join("");

    var hoursBtns = ["2h", "4h", "6h", "8h+"].map(function (h) {
      return '<button class="btn hours-btn' + (h === hours ? " btn-primary active" : "") + '" data-hours="' + h + '">' + h + "</button>";
    }).join("");

    return (
      '<div class="row triage-controls">' +
        '<span class="muted">If I only have:</span>' + hoursBtns +
      "</div>" +
      '<div class="triage-stack">' + rows + "</div>"
    );
  }

  /* current phase's daily template -> live checklist */
  function phaseTemplate(phaseIndex) {
    var templates = arr(CAD.dailyTemplates);
    if (!templates.length) return null;
    // map by P-index tokens in whenPhase
    var token = ["P0", "P1", "P2", "P3"][phaseIndex] || "P0";
    for (var i = 0; i < templates.length; i++) {
      var wp = str(templates[i].whenPhase).toUpperCase();
      if (wp.indexOf(token) !== -1) return templates[i];
    }
    // fallback: clamp index to list
    return templates[Math.min(phaseIndex < 0 ? 0 : phaseIndex, templates.length - 1)];
  }

  function templateChecklistItems(tpl) {
    return arr(tpl.blocks).map(function (b, i) {
      var id = "tpl-" + slug(tpl.name) + "-" + slug(b.block) + "-" + i;
      return {
        id: id,
        label: str(b.block) + (b.time ? "  ·  " + str(b.time) : ""),
        sub: str(b.what) + (b.engine ? "  [" + engineLabel(b.engine) + "]" : ""),
        tag: b.tag || "",
        accent: engineClass(b.engine)
      };
    });
  }

  function renderMission() {
    var dayN = computeDayN();
    var pIdx = currentPhaseIndex(dayN);
    var phase = arr(CAD.phases)[pIdx] || {};
    var hours = lsGet("hours", "8h+");

    var triage = triageItems(dayN);
    var topAction = triage[0] || {};

    /* During the GTM Build Sprint, the sprint IS today's #1 action. */
    var sprintActive = inSprintWindow();
    var sprintDay = computeSprintDay();
    var sprintToday = sprintActive ? sprintDayObj(sprintDay) : null;
    if (sprintToday) {
      var left = sprintItemsLeft(sprintToday);
      topAction = {
        engine: "BOTH",
        task: "GTM Build Sprint · Day " + sprintDay + " of " + SPRINT_DAYS + " — " + str(sprintToday.theme),
        why: left + " item" + (left === 1 ? "" : "s") + " left today · open the Sprint tab to run the checklist (agent-heavy; you approve + handle deploy/record handoffs)"
      };
    }

    var tpl = phaseTemplate(pIdx);

    var html = "";

    /* hero: today + #1 action */
    html += '<div class="mission-hero">';
    html += '<div class="hero-left">';
    if (sprintActive) {
      html += '<div class="hero-day">Sprint <span class="muted">Day ' + sprintDay + " / " + SPRINT_DAYS + "</span></div>";
      html += '<div class="hero-phase ' + engineClass("BOTH") + '">GTM Build Sprint' +
              (sprintToday ? " — " + escapeHtml(str(sprintToday.theme)) : "") + "</div>";
      html += '<div class="muted hero-window">Execution Day 0 = ' + escapeHtml(dateLabel(DAY0)) +
              " · loaded launch after the sprint</div>";
    } else {
      html += '<div class="hero-day">Day ' + dayN + ' <span class="muted">/ ' + TOTAL_DAYS + "</span></div>";
      html += '<div class="hero-phase ' + engineClass("BOTH") + '">' + escapeHtml(phase.name || "Phase") + "</div>";
      if (phase.window) html += '<div class="muted hero-window">' + escapeHtml(phase.window) + "</div>";
    }
    html += '<div class="hero-split">' +
              pill("V1 " + pctOnly(phase.v1Share || ""), "accent-v1") +
              pill("V2 " + pctOnly(phase.v2Share || ""), "accent-v2") +
            "</div>";
    if (phase.v2Mode) html += '<div class="muted hero-mode">' + escapeHtml(phase.v2Mode) + "</div>";
    html += "</div>"; // hero-left

    html += '<div class="hero-right">';
    html += '<div class="section-title">Today\'s #1 action</div>';
    html += '<div class="top-action ' + engineClass(topAction.engine) + '">';
    html += '<span class="top-action-rank">#1</span>';
    html += '<div><div class="top-action-task">' + escapeHtml(topAction.task || "—") +
            " " + pill(engineLabel(topAction.engine), engineClass(topAction.engine)) + "</div>";
    if (topAction.why) html += '<div class="muted">' + escapeHtml(topAction.why) + "</div>";
    html += "</div></div>";
    html += "</div>"; // hero-right
    html += "</div>"; // mission-hero

    /* deliverables nudge — only when there's an active, not-yet-approved one */
    var activeDeliv = activeDeliverable();
    if (activeDeliv) {
      html += '<div class="deliv-nudge" data-goto-deliverables="1" role="button" tabindex="0" ' +
              'title="Open the Deliverables tab">' +
        '<span class="deliv-nudge-ico">📋</span>' +
        '<span class="deliv-nudge-text">Next to review: <b>' + escapeHtml(str(activeDeliv.title)) + "</b></span>" +
        '<span class="deliv-nudge-cta">Review →</span>' +
      "</div>";
    }

    /* milestone countdown chips */
    html += '<div class="section-title mc-section">Milestone countdown</div>';
    html += '<div class="chip-row">' + milestoneChips(dayN) + "</div>";

    /* grid: daily template checklist + triage */
    html += '<div class="grid grid-2 mission-grid">';

    /* left: today's template checklist */
    var tplBody;
    if (tpl) {
      var subtitle = '<div class="muted tpl-sub">' + escapeHtml(tpl.name) +
        (tpl.total ? '  ·  <span class="tpl-total">' + escapeHtml(tpl.total) + "</span>" : "") + "</div>";
      tplBody = subtitle + renderChecklist("mission-tpl", "", templateChecklistItems(tpl), {});
    } else {
      tplBody = '<div class="muted">No daily template found.</div>';
    }
    html += card("Today's plan — " + (phase.name || "current phase"), tplBody, { accent: "accent-both", open: true });

    /* right: triage stack + hours dimmer */
    html += card("Triage stack — what to cut first", renderTriageStack(dayN, hours), { accent: "accent-both", open: true });

    html += "</div>"; // grid

    /* goal banner */
    if (META.goal) {
      html += '<div class="card goal-card"><div class="card-body collapsible open">' +
        '<div class="section-title">90-day goal</div>' +
        '<div class="muted">Founder: ' + escapeHtml(META.founder || "—") + "  ·  Window: " +
        escapeHtml(DAY0) + " → " + escapeHtml(DAY90) + "</div>" +
        "<p>" + escapeHtml(META.goal) + "</p></div></div>";
    }

    el("view-mission").innerHTML = html;
  }

  /* ============================================================= *
   *  6. VENTURE VIEW (v1 / v2)                                   *
   * ============================================================= */
  function ventureStageProgress(v) {
    var stages = arr(v.stages);
    var done = 0;
    stages.forEach(function (s) {
      if (lsGet("stage:" + str(v.id) + ":" + str(s.id), null) === "1") done++;
    });
    return { done: done, total: stages.length };
  }

  function renderScores(v) {
    var s = obj(v.scores);
    var h = obj(v.hormozi);
    var html = '<div class="grid grid-3 score-grid">';
    html += scoreRing("Opportunity", s.opportunity);
    html += scoreRing("Pain", s.pain);
    html += scoreRing("Builder Confidence", s.builderConfidence);
    html += scoreRing("Execution Difficulty", s.executionDifficulty, { lowerBetter: true });
    html += "</div>";

    /* Hormozi value equation row */
    html += '<div class="hormozi-row">' +
      '<span class="muted">Hormozi value equation:</span> ' +
      pill("Dream " + num(h.dream)) + pill("Likelihood " + num(h.likelihood)) +
      pill("Time " + num(h.time)) + pill("Effort " + num(h.effort)) +
      badge("Value " + num(h.value), "badge-value") +
      "</div>";
    return html;
  }

  function renderLadder(v) {
    var rows = arr(v.offerLadder).map(function (r) {
      return (
        '<div class="ladder-rung">' +
          '<span class="rung-no">' + escapeHtml(r.rung) + "</span>" +
          '<div class="rung-main">' +
            '<div class="rung-name">' + escapeHtml(r.name) + "</div>" +
            '<div class="muted rung-purpose">' + escapeHtml(r.purpose) + "</div>" +
          "</div>" +
          '<span class="rung-price">' + escapeHtml(r.price) + "</span>" +
        "</div>"
      );
    }).join("");
    return '<div class="ladder">' + rows + "</div>";
  }

  function renderFunnel(v) {
    var rows = arr(v.funnel).map(function (f) {
      return (
        '<div class="funnel-row">' +
          '<div class="funnel-stage">' + escapeHtml(f.stage) + "</div>" +
          '<div class="funnel-assume">' + badge(str(f.assumption), "badge-soft") + "</div>" +
          '<div class="muted funnel-plan">' + escapeHtml(f.planWith) + "</div>" +
        "</div>"
      );
    }).join("");
    return '<div class="funnel">' +
      '<div class="funnel-row funnel-head"><div>Stage</div><div>Assumption</div><div>Plan with</div></div>' +
      rows + "</div>";
  }

  function renderStage(v, s) {
    var stageId = str(s.id);
    var sKey = "stage:" + str(v.id) + ":" + stageId;
    var done = lsGet(sKey, null) === "1";

    var kpis = arr(s.kpis).map(function (k) {
      return (
        '<div class="stage-kpi' + (k.leading ? " leading" : "") + '">' +
          '<span class="stage-kpi-metric">' + escapeHtml(k.metric) + (k.leading ? ' <span class="pill pill-leading">leading</span>' : "") + "</span>" +
          '<span class="stage-kpi-target">' + escapeHtml(k.target) + "</span>" +
          (k.measure ? '<span class="muted stage-kpi-measure">measure: ' + escapeHtml(k.measure) + "</span>" : "") +
        "</div>"
      );
    }).join("");

    /* dailyPlan -> per-day checklist */
    var planItems = arr(s.dailyPlan).map(function (step, i) {
      return {
        id: "plan-" + str(v.id) + "-" + stageId + "-" + i,
        label: str(step)
      };
    });
    var planHtml = planItems.length
      ? renderChecklist("plan-" + str(v.id) + "-" + stageId, "Daily plan", planItems, {})
      : "";

    var head =
      '<div class="stage-head">' +
        '<span class="stage-id">' + escapeHtml(stageId) + "</span>" +
        '<span class="stage-name">' + escapeHtml(s.name) + "</span>" +
        '<label class="stage-toggle"><input type="checkbox" data-stage="' + escapeHtml(sKey) + '" ' + (done ? "checked" : "") + '> done</label>' +
      "</div>";

    var meta =
      '<div class="muted stage-range">' + escapeHtml(s.dayRange || "") + "</div>" +
      '<div class="stage-goal">' + escapeHtml(s.goal) + "</div>" +
      (s.entry ? '<div class="stage-sub"><b>Entry:</b> <span class="muted">' + escapeHtml(s.entry) + "</span></div>" : "") +
      (s.exit ? '<div class="stage-sub"><b>Exit:</b> <span class="muted">' + escapeHtml(s.exit) + "</span></div>" : "") +
      (s.killScale ? '<div class="stage-sub stage-kill"><b>Kill / Scale:</b> <span class="muted">' + escapeHtml(s.killScale) + "</span></div>" : "");

    var kpisHtml = kpis ? '<div class="section-title stage-sec">KPIs</div><div class="stage-kpis">' + kpis + "</div>" : "";

    return (
      '<div class="stage ' + (done ? "done " : "") + engineClass(v.accent) + '">' +
        head + meta + kpisHtml + planHtml +
      "</div>"
    );
  }

  function renderAgents(v) {
    var rows = arr(v.agents).map(function (a) {
      return (
        '<div class="agent-row">' +
          '<div class="agent-name">' + escapeHtml(a.name) + "</div>" +
          '<div class="agent-owns"><b>Owns:</b> <span class="muted">' + escapeHtml(a.owns) + "</span></div>" +
          '<div class="agent-human"><b>Human touch:</b> <span class="muted">' + escapeHtml(a.humanTouch) + "</span></div>" +
          '<div class="agent-active">' + pill(str(a.activeFrom), "pill-soft") + "</div>" +
        "</div>"
      );
    }).join("");
    return '<div class="agents">' + rows + "</div>";
  }

  function renderBudget(v) {
    var rows = arr(v.budget).map(function (b) {
      return '<div class="budget-row"><span>' + escapeHtml(b.item) + "</span><span class=\"budget-cost\">" + escapeHtml(b.cost) + "</span></div>";
    }).join("");
    return '<div class="budget">' + rows + "</div>";
  }

  function renderRisks(v) {
    var rows = arr(v.risks).map(function (r) {
      return '<li class="risk-row">' + escapeHtml(r) + "</li>";
    }).join("");
    return '<ul class="risks">' + rows + "</ul>";
  }

  function renderVenture(viewId, v) {
    var node = el(viewId);
    if (!node) return;
    if (!v || !v.id) { node.innerHTML = '<div class="muted">No data.</div>'; return; }

    var accent = engineClass(v.accent);
    var prog = ventureStageProgress(v);
    var pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;

    var html = "";

    /* header */
    html += '<div class="venture-head ' + accent + '">';
    html += '<div class="venture-title">' + escapeHtml(v.name) + " " + badge(str(v.id).toUpperCase(), accent) + "</div>";
    html += '<div class="muted venture-tagline">' + escapeHtml(v.tagline) + "</div>";
    html += '<div class="venture-prog"><div class="row"><span class="muted">Stages complete</span><span class="spacer"></span><span>' +
            prog.done + " / " + prog.total + "</span></div>" +
            '<div class="progress"><div class="progress-bar" style="width:' + pct + '%"></div></div></div>';
    html += "</div>";

    /* scores */
    html += card("Scores & value equation", renderScores(v), { accent: accent, open: true });

    /* positioning + method + target */
    var posBody = "";
    if (v.honestTarget) posBody += '<div class="section-title">Honest 90-day target</div><p>' + escapeHtml(v.honestTarget) + "</p>";
    if (v.positioning) posBody += '<div class="section-title">Positioning</div><p>' + escapeHtml(v.positioning) + "</p>";
    if (v.beachhead) posBody += '<div class="section-title">Beachhead</div><p class="muted">' + escapeHtml(v.beachhead) + "</p>";
    var method = obj(v.method);
    if (method.name || method.desc) {
      posBody += '<div class="section-title">Method — ' + escapeHtml(method.name || "") + "</div><p>" + escapeHtml(method.desc) + "</p>";
    }
    if (posBody) html += card("Positioning & method", posBody, { accent: accent, open: true });

    /* gate */
    var gate = obj(v.gate);
    if (gate.modeA || gate.modeB || gate.trigger) {
      var gateBody =
        (gate.modeA ? '<div class="gate-row"><b>Mode A:</b> <span class="muted">' + escapeHtml(gate.modeA) + "</span></div>" : "") +
        (gate.modeB ? '<div class="gate-row"><b>Mode B:</b> <span class="muted">' + escapeHtml(gate.modeB) + "</span></div>" : "") +
        (gate.trigger ? '<div class="gate-row gate-trigger"><b>Trigger:</b> <span class="muted">' + escapeHtml(gate.trigger) + "</span></div>" : "");
      html += card("The gate (V1↔V2 capacity split)", gateBody, { accent: accent, open: false });
    }

    /* offer ladder */
    if (arr(v.offerLadder).length) html += card("Offer ladder", renderLadder(v), { accent: accent, open: false });

    /* funnel */
    if (arr(v.funnel).length) html += card("Funnel math", renderFunnel(v), { accent: accent, open: false });

    /* stages */
    var stagesHtml = arr(v.stages).map(function (s) { return renderStage(v, s); }).join("");
    html += card("Stages — " + prog.done + "/" + prog.total + " done", stagesHtml || '<div class="muted">No stages.</div>', { accent: accent, open: true });

    /* agents */
    if (arr(v.agents).length) html += card("Agent roster", renderAgents(v), { accent: accent, open: false });

    /* budget */
    if (arr(v.budget).length) html += card("Budget", renderBudget(v), { accent: accent, open: false });

    /* risks */
    if (arr(v.risks).length) html += card("Risks", renderRisks(v), { accent: accent, open: false });

    node.innerHTML = html;
  }

  /* ============================================================= *
   *  7. CADENCE VIEW                                             *
   * ============================================================= */
  function renderPhases(dayN, pIdx) {
    var rows = arr(CAD.phases).map(function (p, i) {
      var current = (i === pIdx);
      return (
        '<div class="phase-row' + (current ? " phase-current" : "") + '">' +
          '<div class="phase-name">' + (current ? badge("NOW", "badge-now") + " " : "") + escapeHtml(p.name) + "</div>" +
          '<div class="muted phase-window">' + escapeHtml(p.window) + "</div>" +
          '<div class="phase-trigger"><b>Trigger:</b> <span class="muted">' + escapeHtml(p.trigger) + "</span></div>" +
          '<div class="phase-split">' + pill("V1 " + pctOnly(p.v1Share || ""), "accent-v1") + pill("V2 " + pctOnly(p.v2Share || ""), "accent-v2") + "</div>" +
          (p.v2Mode ? '<div class="muted phase-mode">' + escapeHtml(p.v2Mode) + "</div>" : "") +
        "</div>"
      );
    }).join("");
    return '<div class="phases">' + rows + "</div>";
  }

  function renderDailyTemplates() {
    return arr(CAD.dailyTemplates).map(function (t) {
      var blocks = arr(t.blocks).map(function (b) {
        return (
          '<div class="tpl-block ' + engineClass(b.engine) + '">' +
            '<div class="tpl-block-head">' +
              '<span class="tpl-block-name">' + escapeHtml(b.block) + "</span>" +
              '<span class="tpl-block-time">' + escapeHtml(b.time) + "</span>" +
              (b.tag ? '<span class="tag ' + tagClass(b.tag) + '">' + escapeHtml(b.tag) + "</span>" : "") +
            "</div>" +
            '<div class="muted tpl-block-what">' + pill(engineLabel(b.engine), engineClass(b.engine)) + " " + escapeHtml(b.what) + "</div>" +
          "</div>"
        );
      }).join("");
      var body =
        '<div class="muted tpl-when">When: ' + escapeHtml(t.whenPhase) + "  ·  Total: " + escapeHtml(t.total) + "</div>" +
        '<div class="tpl-blocks">' + blocks + "</div>";
      return card(t.name, body, { accent: "accent-both", open: false });
    }).join("");
  }

  function renderWeekly() {
    var dayISO = todayISO();
    var items = [];
    arr(CAD.weekly).forEach(function (w, i) {
      [["v1", "accent-v1"], ["v2", "accent-v2"], ["shared", "accent-both"]].forEach(function (pair) {
        var key = pair[0], accent = pair[1];
        var val = str(w[key]);
        if (!val || val === "—") {
          if (val === "—") {
            items.push({ id: "wk-" + slug(w.day) + "-" + key, label: str(w.day) + " · " + key.toUpperCase() + " — rest", accent: accent });
          }
          return;
        }
        items.push({
          id: "wk-" + slug(w.day) + "-" + key + "-" + i,
          label: str(w.day) + " · " + key.toUpperCase(),
          sub: val,
          accent: accent
        });
      });
    });
    return renderChecklist("cadence-weekly", "", items, {});
  }

  /* pull the first integer out of a "Day N" / "Day a-b" style token */
  function dayTokenStart(s) {
    var m = str(s).match(/(\d+)/);
    return m ? num(m[1], -1) : -1;
  }

  function renderTimeline(dayN) {
    var list = arr(CAD.timeline);
    /* find the row whose day index brackets today (the last row at-or-before dayN) */
    var nowIdx = -1;
    for (var i = 0; i < list.length; i++) {
      var d = dayTokenStart(list[i].day);
      if (d >= 0 && d <= dayN) nowIdx = i;
    }
    var rows = list.map(function (t, i) {
      var isNow = (i === nowIdx);
      return (
        '<div class="timeline-row' + (isNow ? " now" : "") + '">' +
          '<div class="tl-day">' + escapeHtml(t.day) + "<small>" + escapeHtml(t.date) + "</small></div>" +
          '<div class="tl-v1 ' + engineClass("V1") + '"><b>V1:</b> ' + escapeHtml(t.v1) + "</div>" +
          '<div class="tl-v2 ' + engineClass("V2") + '"><b>V2:</b> ' + escapeHtml(t.v2) + "</div>" +
          '<div class="tl-split">' + pill(str(t.split), "accent-both") + "</div>" +
        "</div>"
      );
    }).join("");
    return '<div class="timeline">' + rows + "</div>";
  }

  function renderCadence() {
    var node = el("view-cadence");
    if (!node) return;
    var dayN = computeDayN();
    var pIdx = currentPhaseIndex(dayN);

    var html = "";
    html += card("Phases", renderPhases(dayN, pIdx), { accent: "accent-both", open: true });
    if (CAD.splitNote) {
      html += card("The split — why never 50/50", "<p>" + escapeHtml(CAD.splitNote) + "</p>", { accent: "accent-both", open: false });
    }
    html += '<div class="section-title mc-section">Daily templates</div>';
    html += renderDailyTemplates();
    html += card("Weekly rhythm (checklist)", renderWeekly(), { accent: "accent-both", open: true });
    if (arr(CAD.triage).length) {
      html += card("Triage priority (full)", renderTriageStack(dayN, lsGet("hours", "8h+")), { accent: "accent-both", open: false });
    }
    html += card("90-day timeline", renderTimeline(dayN), { accent: "accent-both", open: true });

    node.innerHTML = html;
  }

  /* ============================================================= *
   *  8. KPI VIEW                                                 *
   * ============================================================= */
  function bandClass(band) {
    var b = str(band).toLowerCase();
    if (b === "green") return "band-green";
    if (b === "amber") return "band-amber";
    if (b === "red") return "band-red";
    return "";
  }

  function renderKpiRow(k) {
    var n = num(k.n, 0);
    var isMeta = (n === 13);
    var savedStatus = lsGet("kpi:" + n, "auto"); // auto | green | amber | red
    var savedVal = lsGet("kpival:" + n, "");
    var rowBand = savedStatus === "auto" ? "" : bandClass(savedStatus);

    var statusBtns = ["auto", "green", "amber", "red"].map(function (s) {
      var active = (s === savedStatus) ? " active" : "";
      var cls = s === "green" ? "st-green" : s === "amber" ? "st-amber" : s === "red" ? "st-red" : "st-auto";
      return '<button class="btn kpi-status ' + cls + active + '" data-kpi-status="' + n + '" data-status="' + s + '">' + s + "</button>";
    }).join("");

    return (
      '<div class="kpi-row ' + rowBand + (isMeta ? " meta" : "") + '" data-kpi-n="' + n + '">' +
        '<div class="kpi-n">' + (isMeta ? badge("META", "badge-now") + " " : "") + "#" + n + "</div>" +
        '<div class="kpi-engine">' + pill(engineLabel(k.engine), engineClass(k.engine)) + "</div>" +
        '<div class="kpi-indicator">' + escapeHtml(k.indicator) + (isMeta ? '<div class="muted">read this first — the feasibility meta-metric</div>' : "") + "</div>" +
        '<div class="kpi-band">' + escapeHtml(k.band) + "</div>" +
        '<div class="kpi-redflag muted">⚑ ' + escapeHtml(k.redFlag) + "</div>" +
        '<div class="kpi-current"><input class="input kpi-input" type="text" placeholder="current…" value="' + escapeHtml(savedVal) + '" data-kpi-input="' + n + '"></div>' +
        '<div class="kpi-statusset">' + statusBtns + "</div>" +
      "</div>"
    );
  }

  function renderKpis() {
    var node = el("view-kpis");
    if (!node) return;
    var sorted = KPIS.slice().sort(function (a, b) { return num(a.n) - num(b.n); });

    /* float the meta-metric (13) to the top so it's read first */
    var meta = sorted.filter(function (k) { return num(k.n) === 13; });
    var rest = sorted.filter(function (k) { return num(k.n) !== 13; });
    var ordered = meta.concat(rest);

    var rowsHtml = ordered.map(renderKpiRow).join("");

    var header =
      '<div class="kpi-row kpi-head">' +
        '<div class="kpi-n">#</div>' +
        '<div class="kpi-engine">Engine</div>' +
        '<div class="kpi-indicator">Indicator</div>' +
        '<div class="kpi-band">Healthy band</div>' +
        '<div class="kpi-redflag">Red flag</div>' +
        '<div class="kpi-current">Current</div>' +
        '<div class="kpi-statusset">Status</div>' +
      "</div>";

    var body =
      '<p class="muted">Set a current value and a status per indicator (auto leaves the row neutral). Row #13 is the feasibility meta-metric — read it first.</p>' +
      '<div class="kpi-table">' + header + rowsHtml + "</div>";

    node.innerHTML = card("13 leading indicators", body, { accent: "accent-both", open: true });
  }

  /* ============================================================= *
   *  9. FRAMEWORKS VIEW                                          *
   * ============================================================= */
  function renderFrameworks() {
    var node = el("view-frameworks");
    if (!node) return;

    /* group by category, preserve first-seen order */
    var cats = [];
    var byCat = {};
    FRAMEWORKS.forEach(function (f) {
      var c = str(f.category) || "Other";
      if (!byCat[c]) { byCat[c] = []; cats.push(c); }
      byCat[c].push(f);
    });

    var html = "";
    cats.forEach(function (c) {
      html += '<div class="section-title mc-section">' + escapeHtml(c) + "</div>";
      byCat[c].forEach(function (f) {
        var detail = str(f.detail);
        var detailHtml = detail
          ? '<div class="fw-detail">' + escapeHtml(detail).replace(/\n/g, "<br>") + "</div>"
          : "";
        var body =
          '<div class="fw-summary">' + escapeHtml(f.summary) + "</div>" +
          detailHtml +
          (f.source ? '<div class="muted fw-source">Source: ' + escapeHtml(f.source) + "</div>" : "");
        html += card(f.name, body, { accent: "accent-both", open: false, headExtra: badge(str(f.category), "badge-soft") + " " });
      });
    });

    if (!html) html = '<div class="muted">No frameworks.</div>';
    node.innerHTML = html;
  }

  /* ============================================================= *
   *  10. STATUS STRIP + THEME                                    *
   * ============================================================= */
  function fillStatusStrip() {
    var strip = el("status-strip");
    if (!strip) return;

    /* Before execution day-0, show the Build-Sprint status. */
    if (inSprintWindow()) {
      var sd = computeSprintDay();
      var dayObj = sprintDayObj(sd);
      var left = sprintItemsLeft(dayObj);
      strip.textContent =
        "Build Sprint · Day " + sd + " of " + SPRINT_DAYS +
        " · " + left + " item" + (left === 1 ? "" : "s") + " left";
      strip.setAttribute("title", "Sprint " + SPRINT_START + " → execution Day 0 " + DAY0);
      return;
    }

    var dayN = computeDayN();
    var pIdx = currentPhaseIndex(dayN);
    var phase = arr(CAD.phases)[pIdx] || {};
    var remaining = Math.max(0, TOTAL_DAYS - dayN);
    var v1 = pctOnly(phase.v1Share || "");
    var v2 = pctOnly(phase.v2Share || "");
    strip.textContent =
      "Day " + dayN + " · " + (phase.name || "Pre-launch") +
      " · V1 " + v1 + "% / V2 " + v2 + "% · " +
      remaining + " days to Sep 15";
    strip.setAttribute("title", "Window " + DAY0 + " → " + DAY90);
  }

  function applyTheme() {
    var theme = lsGet("theme", "light");
    if (theme === "light") document.body.classList.add("light");
    else document.body.classList.remove("light");
    var btn = el("theme-toggle");
    if (btn) btn.textContent = (theme === "light") ? "Dark" : "Light";
  }
  function toggleTheme() {
    var cur = lsGet("theme", "light");
    var next = (cur === "light") ? "dark" : "light";
    lsSet("theme", next);
    applyTheme();
  }

  /* ============================================================= *
   *  11. NAV                                                     *
   * ============================================================= */
  var VIEWS = ["sprint", "deliverables", "mission", "v1", "v2", "cadence", "kpis", "frameworks"];

  function showView(view) {
    if (VIEWS.indexOf(view) === -1) view = "mission";
    VIEWS.forEach(function (v) {
      var sec = el("view-" + v);
      if (sec) sec.classList.toggle("active", v === view);
    });
    qsa(".nav-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });
    lsSet("view", view);
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  /* ============================================================= *
   *  12. EVENT WIRING (delegated)                                *
   * ============================================================= */
  function wireEvents() {
    /* nav */
    qsa(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        showView(b.getAttribute("data-view"));
      });
    });

    /* theme */
    var tt = el("theme-toggle");
    if (tt) tt.addEventListener("click", toggleTheme);

    /* delegated click handler on the document body */
    document.addEventListener("click", function (e) {
      var t = e.target;

      /* collapsible card head — toggle .open on its body */
      var head = closest(t, ".card-head");
      if (head) {
        var body = head.parentNode && head.parentNode.querySelector(".collapsible");
        if (body) {
          body.classList.toggle("open");
          var chev = head.querySelector(".chev");
          if (chev) chev.textContent = body.classList.contains("open") ? "▾" : "▸";
        }
        return;
      }

      /* hours dimmer */
      var hb = closest(t, ".hours-btn");
      if (hb) {
        var h = hb.getAttribute("data-hours");
        lsSet("hours", h);
        // update triage on mission + cadence without full re-render where possible
        applyHoursDim(h);
        return;
      }

      /* reset-today button */
      var rb = closest(t, ".btn-reset");
      if (rb) {
        e.preventDefault();
        var groupId = rb.getAttribute("data-reset-group");
        resetGroup(groupId);
        return;
      }

      /* KPI status buttons */
      var ks = closest(t, ".kpi-status");
      if (ks) {
        var n = ks.getAttribute("data-kpi-status");
        var status = ks.getAttribute("data-status");
        lsSet("kpi:" + n, status);
        applyKpiStatus(n, status);
        return;
      }

      /* Mission nudge chip -> jump to the Deliverables view */
      var nudge = closest(t, "[data-goto-deliverables]");
      if (nudge) {
        e.preventDefault();
        showView("deliverables");
        return;
      }

      /* Deliverable: APPROVE */
      var ap = closest(t, "[data-deliv-approve]");
      if (ap) {
        e.preventDefault();
        approveDeliverable(ap.getAttribute("data-deliv-approve"));
        return;
      }

      /* Deliverable: DENY */
      var dn = closest(t, "[data-deliv-deny]");
      if (dn) {
        e.preventDefault();
        denyDeliverable(dn.getAttribute("data-deliv-deny"));
        return;
      }

      /* Deliverable: UNDO (revert an approval) */
      var un = closest(t, "[data-deliv-undo]");
      if (un) {
        e.preventDefault();
        undoDeliverable(un.getAttribute("data-deliv-undo"));
        return;
      }

      /* Deliverable: COPY DECISIONS (reveal/refresh export textarea) */
      var cp = closest(t, "[data-deliv-copy]");
      if (cp) {
        e.preventDefault();
        toggleDecisionsExport();
        return;
      }

      /* Deliverable: DOWNLOAD NOTES (save a .md file Claude can read) */
      var dl = closest(t, "[data-deliv-download]");
      if (dl) {
        e.preventDefault();
        downloadDecisions();
        return;
      }
    });

    /* delegated change handler (checkboxes + stage toggles) */
    document.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;

      /* checklist checkbox */
      if (t.getAttribute && t.getAttribute("data-check-input") !== null && t.type === "checkbox") {
        var id = t.getAttribute("data-check-input");
        setChecked(id, t.checked);
        var label = closest(t, ".check");
        if (label) label.classList.toggle("checked", t.checked);
        var group = closest(t, ".checklist");
        refreshChecklistProgress(group);
        return;
      }

      /* stage done toggle */
      if (t.getAttribute && t.getAttribute("data-stage") !== null && t.type === "checkbox") {
        var sKey = t.getAttribute("data-stage");
        if (t.checked) lsSet(sKey, "1");
        else { try { window.localStorage.removeItem(P + sKey); } catch (er) {} }
        var stageNode = closest(t, ".stage");
        if (stageNode) stageNode.classList.toggle("done", t.checked);
        // refresh venture progress bar (re-render that venture)
        var vid = sKey.split(":")[1];
        if (vid === "v1") renderVenture("view-v1", V1);
        else if (vid === "v2") renderVenture("view-v2", V2);
        return;
      }
    });

    /* delegated input handler (KPI current values + deliverable notes) */
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute("data-kpi-input") !== null) {
        var n = t.getAttribute("data-kpi-input");
        lsSet("kpival:" + n, t.value);
        return;
      }
      /* Persist deliverable notes into the stored record, PRESERVING the current
         status. Typing notes must never change an undecided card to "denied" —
         only the explicit Deny button sets status="denied" (it reads these notes
         via currentDelivNotes). No re-render here so the textarea keeps focus. */
      if (t.getAttribute("data-deliv-notes") !== null) {
        var did = t.getAttribute("data-deliv-notes");
        var rec = delivRecord(did);
        delivSet(did, rec.status || "", t.value);
        return;
      }
    });

    /* keyboard: Enter/Space on a card head toggles it (accessibility) */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " " && e.keyCode !== 13 && e.keyCode !== 32) return;
      var head = closest(e.target, ".card-head");
      if (head && e.target === head) {
        e.preventDefault();
        head.click();
        return;
      }
      /* Enter/Space on the mission deliverables nudge -> open the view */
      var nudge = closest(e.target, "[data-goto-deliverables]");
      if (nudge && e.target === nudge) {
        e.preventDefault();
        showView("deliverables");
      }
    });
  }

  /* re-apply hours dim across any rendered triage stacks */
  function applyHoursDim(h) {
    var cutoff = hoursCutoff(h);
    qsa(".triage-stack").forEach(function (stack) {
      qsa(".triage-item", stack).forEach(function (item) {
        var rankNode = item.querySelector(".triage-rank");
        var rank = rankNode ? num(rankNode.textContent, 99) : 99;
        item.classList.toggle("dim", rank > cutoff);
      });
    });
    qsa(".hours-btn").forEach(function (b) {
      var on = b.getAttribute("data-hours") === h;
      b.classList.toggle("active", on);
      b.classList.toggle("btn-primary", on);
    });
  }

  /* apply a KPI status to its row + buttons in place */
  function applyKpiStatus(n, status) {
    var row = document.querySelector('.kpi-row[data-kpi-n="' + n + '"]');
    if (row) {
      row.classList.remove("band-green", "band-amber", "band-red");
      if (status !== "auto") row.classList.add(bandClass(status));
    }
    qsa('.kpi-status[data-kpi-status="' + n + '"]').forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-status") === status);
    });
  }

  /* reset all checkboxes in a group for today */
  function resetGroup(groupId) {
    var group = document.querySelector('.checklist[data-group="' + groupId + '"]');
    if (!group) return;
    qsa("[data-check-input]", group).forEach(function (box) {
      box.checked = false;
      setChecked(box.getAttribute("data-check-input"), false);
      var label = closest(box, ".check");
      if (label) label.classList.remove("checked");
    });
    refreshChecklistProgress(group);
  }

  /* ---- Deliverable actions ---------------------------------------------- *
     Each mutates localStorage then re-renders the Deliverables view AND the
     Sprint + Mission views so gated checkboxes + the nudge update at once.   */
  function currentDelivNotes(id) {
    var ta = document.querySelector('[data-deliv-notes="' + id + '"]');
    return ta ? str(ta.value) : delivRecord(id).notes;
  }
  function refreshGatedViews() {
    safe(renderDeliverables);
    safe(renderSprint);
    safe(renderMission);
  }
  function approveDeliverable(id) {
    if (!id) return;
    delivSet(id, "approved", currentDelivNotes(id));
    refreshGatedViews();
  }
  function denyDeliverable(id) {
    if (!id) return;
    delivSet(id, "denied", currentDelivNotes(id));
    refreshGatedViews();
  }
  function undoDeliverable(id) {
    if (!id) return;
    /* Revert to undecided/active but PRESERVE any notes (e.g. revision notes from
       an earlier deny). If there are no notes, drop the record entirely so the
       deliverable returns to a pristine state. */
    var rec = delivRecord(id);
    if (rec.notes) delivSet(id, "", rec.notes);
    else delivClear(id);
    refreshGatedViews();
  }

  /* ---- Copy decisions export -------------------------------------------- *
     Build a plain-text report of ALL deliverables (in approval order), reading
     each one's stored {status, notes} from localStorage via delivRecord().
     Used by the "⎘ Copy decisions" button in the Deliverables header.        */
  function delivStatusWord(status) {
    var s = str(status);
    if (s === "approved") return "APPROVED";
    if (s === "denied") return "DENIED";
    return "PENDING";
  }
  function buildDecisionsReport() {
    var lines = [];
    lines.push("MISSION CONTROL — DELIVERABLE DECISIONS (exported " + new Date().toLocaleString() + ")");
    lines.push("");
    delivList().forEach(function (item) {
      var rec = delivRecord(item.id);
      lines.push(str(item.id) + " · " + str(item.title) + " — " + delivStatusWord(rec.status));
      if (rec.notes) lines.push("    notes: " + str(rec.notes));
    });
    return lines.join("\n");
  }
  /* Reveal/refresh the export textarea below the button, set its raw value, and
     attempt clipboard write (best-effort — blocked on many file:// origins, so
     the selectable textarea is the real fallback). A second click toggles it. */
  function toggleDecisionsExport() {
    var panel = el("deliv-export");
    var ta = el("deliv-export-ta");
    var hint = el("deliv-export-hint");
    if (!panel || !ta) return;

    /* second click while already open -> hide */
    if (!panel.hidden) {
      panel.hidden = true;
      return;
    }

    var report = buildDecisionsReport();
    ta.value = report; // raw text, never innerHTML

    var copied = false;
    try {
      if (window.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(report);
        copied = true;
      }
    } catch (e) { copied = false; }

    if (hint) {
      hint.textContent = copied
        ? "Copied to clipboard — or select the box and Ctrl+C, then paste to Claude."
        : "Select the box and Ctrl+C (or ⌘C), then paste to Claude.";
    }

    panel.hidden = false;
    try { ta.focus(); ta.select(); } catch (e2) {}
  }

  /* Download decisions + notes as a Markdown file. A local file:// page cannot
     silently write to disk, but a Blob + <a download> is allowed, so the file
     lands in your Downloads folder, which Claude CAN read. This is the bridge
     that makes your in-dashboard notes viewable locally. */
  function downloadDecisions() {
    var report = buildDecisionsReport();
    var body = "# Mission Control notes for Claude\n\n" +
      "Downloaded from the dashboard. Hand this to Claude (it is in your Downloads),\n" +
      "or drop it into the mission-control folder. Write any free-text notes under the heading.\n\n" +
      "## My notes\n\n(write anything here)\n\n---\n\n## Deliverable decisions\n\n" + report + "\n";
    var ok = false;
    try {
      var blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
      var url = (window.URL || window.webkitURL).createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "mission-control-notes.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { try { (window.URL || window.webkitURL).revokeObjectURL(url); } catch (e) {} }, 1500);
      ok = true;
    } catch (e) { ok = false; }
    var panel = el("deliv-export");
    var ta = el("deliv-export-ta");
    var hint = el("deliv-export-hint");
    if (ta) ta.value = body;
    if (panel) panel.hidden = false;
    if (hint) {
      hint.textContent = ok
        ? "Saved mission-control-notes.md to your Downloads. Tell Claude to read it (or copy the box below)."
        : "Download was blocked here. Select the box below and press Ctrl+C, then paste to Claude.";
    }
  }

  /* tiny closest() polyfill-ish (Element.closest is fine on modern browsers,
     but guard for safety / text nodes) */
  function closest(node, sel) {
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(sel)) return node;
      node = node.parentNode;
    }
    return null;
  }

  /* ============================================================= *
   *  13. BOOT                                                    *
   * ============================================================= */
  function renderAll() {
    safe(renderSprint);
    safe(renderDeliverables);
    safe(renderMission);
    safe(function () { renderVenture("view-v1", V1); });
    safe(function () { renderVenture("view-v2", V2); });
    safe(renderCadence);
    safe(renderKpis);
    safe(renderFrameworks);
    safe(fillStatusStrip);
  }

  function safe(fn) {
    try { fn(); } catch (e) {
      if (window.console && console.warn) console.warn("MC render guard:", e);
    }
  }

  function boot() {
    applyTheme();
    renderAll();
    wireEvents();
    // restore hours selection visual after render
    applyHoursDim(lsGet("hours", "8h+"));
    // default landing: Sprint while in the sprint window, else Mission (or last view)
    var defaultView = inSprintWindow() ? "sprint" : "mission";
    showView(lsGet("view", defaultView));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
