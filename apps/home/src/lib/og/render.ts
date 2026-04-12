// Build-time satori → resvg PNG pipeline.
//
// Fonts are loaded from the `geist` npm package (devDependency) once at module
// initialisation and cached for the entire build — ~3 readFileSync calls total.

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import type { OgSource } from './sources';
import { OgTemplate } from './template';

// process.cwd() is apps/home during `astro build` / `astro dev`.
const GEIST_DIR = path.join(process.cwd(), 'node_modules', 'geist', 'dist', 'fonts', 'geist-sans');

// Loaded once, cached for the lifetime of the build process.
const fonts: Parameters<typeof satori>[1]['fonts'] = [
  {
    name: 'Geist',
    data: readFileSync(path.join(GEIST_DIR, 'Geist-Regular.ttf')),
    weight: 400,
    style: 'normal',
  },
  {
    name: 'Geist',
    data: readFileSync(path.join(GEIST_DIR, 'Geist-SemiBold.ttf')),
    weight: 600,
    style: 'normal',
  },
  {
    name: 'Geist',
    data: readFileSync(path.join(GEIST_DIR, 'Geist-Bold.ttf')),
    weight: 700,
    style: 'normal',
  },
];

export async function renderOgImage(source: OgSource): Promise<Uint8Array> {
  const svg = await satori(OgTemplate(source), {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // Disable system font fallback for deterministic cross-platform builds.
      loadSystemFonts: false,
    },
  });

  return resvg.render().asPng();
}
