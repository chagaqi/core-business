"use client";

import { useEffect } from "react";

/**
 * PaperTexture — the site's crumpled-paper surface, baked ONCE.
 *
 * The locked crumple = feTurbulence(fractalNoise) → feDiffuseLighting at the
 * canonical tokens below. Applying that as a LIVE filter per element would spam
 * expensive lighting passes and (on movers) re-evaluate per frame — banned. So
 * we bake the filter output to a seamless PNG in a canvas ONCE on mount, then
 * reuse that raster everywhere as a cheap `background-image` with multiply
 * blending (identical result to the live filter's arithmetic-multiply composite,
 * because multiplying the lit-crumple over a surface IS what the filter did).
 *
 * Two strengths from the same tokens: `--paper-crumple` (hero) and
 * `--paper-crumple-soft` (the site-wide tasteful sprinkle, whitened toward the
 * page). Only the flat paper SURFACES take the photographic crumple; the cut-out
 * objects (boat, sun, clouds, waves) keep their own designed fold/facet language.
 *
 * SSR-safe: base surface colors render server-side; the vars are empty until the
 * client bake sets them, so the texture arrives progressively with zero CLS.
 * Static texture → reduced-motion unaffected. No external assets — all generated.
 */

// ── LOCKED TEXTURE TOKENS (canonical — mirror these in boat-lab.html) ──
const AZIMUTH = 52; // light angle
const ELEVATION = 60; // kept from the approved lab render
const BASE_FREQ = 0.01; // crease scale
const SURFACE = 2.2; // crinkle intensity
const TILE = 400; // BASE_FREQ * TILE = 4 (integer) → stitchTiles seam-free

function bakeSvg(surfaceScale: number, whiten: number) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">` +
    // NO color-interpolation-filters override: the approved lab render ran in the
    // default linearRGB space, which is what gives the crisp ridge contrast.
    // Forcing sRGB here flattened it into a faint mottle (it did).
    `<filter id="c" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${BASE_FREQ}" numOctaves="4" seed="7" stitchTiles="stitch"/>` +
    `<feDiffuseLighting lighting-color="#ffffff" surfaceScale="${surfaceScale}" diffuseConstant="1">` +
    `<feDistantLight azimuth="${AZIMUTH}" elevation="${ELEVATION}"/>` +
    `</feDiffuseLighting></filter>` +
    `<rect width="${TILE}" height="${TILE}" filter="url(#c)"/>` +
    (whiten ? `<rect width="${TILE}" height="${TILE}" fill="#fff" opacity="${whiten}"/>` : "") +
    `</svg>`
  );
}

function bake(svg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = TILE;
      c.height = TILE;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no 2d ctx"));
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;base64," + btoa(svg);
  });
}

export function PaperTexture() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // HIGH-KEY tiles. feDiffuseLighting returns a mid-grey relief; multiplying
        // that raw darkens the whole surface into mud (it did — a grey slab). So
        // the tile is whitened first: multiply then bites only in the CREASES, the
        // surface keeps its color, and text over it stays crisp (multiply can only
        // darken → AA never improves-or-breaks unexpectedly).
        //
        // RELIEF vs the locked token: SURFACE (2.2) is the relief the approved lab
        // produced on a WHITE page. Whitened + multiplied over the hero's tinted
        // sky it disappears (verified side-by-side against the live lab filter), so
        // the hero runs a boosted relief that reproduces the approved LOOK on a
        // colored surface. Light angle + crease scale stay exactly as locked.
        const full = await bake(bakeSvg(SURFACE * 2.27, 0.35)); // ≈5.0 — reads as paper
        const soft = await bake(bakeSvg(SURFACE * 1.45, 0.6)); // ≈3.2 — the sprinkle
        // The boat is saturated terracotta and small on screen: a gentle relief
        // vanishes on it (verified). Harder, barely-whitened relief so the paper
        // it's folded from is unmistakable without dulling the color.
        const object = await bake(bakeSvg(SURFACE * 3.4, 0.12)); // ≈7.5
        if (cancelled) return;
        const root = document.documentElement.style;
        root.setProperty("--paper-crumple", `url("${full}")`);
        root.setProperty("--paper-crumple-soft", `url("${soft}")`);

        // SVG can't read a CSS var as an <image href>, so the baked tile is
        // handed to any <image data-crumple> in the tree (the boat patterns).
        // Parent effects run after children mount, so the nodes exist here.
        const tiles: Record<string, string> = { full, soft, object };
        document.querySelectorAll<SVGImageElement>("image[data-crumple]").forEach((el) => {
          el.setAttribute("href", tiles[el.dataset.crumple ?? "full"] ?? full);
        });
      } catch {
        /* leave base colors; texture is a progressive enhancement */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Renders nothing — the page sheet lives on <body> (background-image +
  // multiply in globals.css), panels on .panel, the hero sky on .oc-sky-paper,
  // and the sun/clouds on their masked .oc-crumple overlays. This component
  // only performs the one-time bake and sets the vars they all read.
  return null;
}
