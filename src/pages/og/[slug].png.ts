import { createElement as h } from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';

const ROOT = process.cwd();

function loadFont(subpath: string): ArrayBuffer {
  const p = resolve(ROOT, 'node_modules/@fontsource', subpath);
  return readFileSync(p).buffer;
}

const FONTS = [
  { name: 'Inter', data: loadFont('inter/files/inter-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: loadFont('inter/files/inter-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Inter', data: loadFont('inter/files/inter-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'DM Serif Display', data: loadFont('dm-serif-display/files/dm-serif-display-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'DM Serif Display', data: loadFont('dm-serif-display/files/dm-serif-display-latin-400-italic.woff'), weight: 400 as const, style: 'italic' as const },
  { name: 'JetBrains Mono', data: loadFont('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
];

interface OgPage {
  slug: string;
  title: string;
  subtitle: string;
}

const OG_PAGES: OgPage[] = [
  { slug: 'home', title: 'Max Guo', subtitle: 'LLM Calibration & Trust in AI Coaching' },
  { slug: 'about', title: 'About Max Guo', subtitle: 'Independent researcher in human-AI trust calibration' },
  { slug: 'research', title: 'Research', subtitle: 'Precision Illusion — from theory to intervention to infrastructure' },
  { slug: 'publications', title: 'Publications', subtitle: 'LLM calibration, trust calibration, and human-AI interaction' },
  { slug: 'fitcalib-bench', title: 'MaxFitCalib-Bench', subtitle: 'A Benchmark for LLM Calibration in Fitness Advice' },
  { slug: 'checkmycoach', title: 'CheckMyCoach', subtitle: 'A Calibration Pipeline for LLM Uncertainty Expression' },
  { slug: 'caltrust', title: 'CalTrust', subtitle: 'Adaptive Trust Calibration via Contextual Bandits' },
  { slug: 'pi-discovery', title: 'PI Discovery Engine', subtitle: 'From Research Topics to Investigator Cards' },
];

export const getStaticPaths: GetStaticPaths = () => {
  return OG_PAGES.map((p) => ({ params: { slug: p.slug } }));
};

const BG = '#F5F0E6';
const ACCENT = '#B85A3A';
const INK = '#1A1A18';
const MUTED = '#6B6660';

function OgTemplate(page: OgPage) {
  return h('div', {
    style: {
      width: 1200,
      height: 630,
      backgroundColor: BG,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '80px 80px 80px 100px',
      position: 'relative',
    },
  }, [
    // Left accent bar
    h('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 12,
        height: '100%',
        backgroundColor: ACCENT,
      },
    }),
    // Title
    h('div', {
      style: {
        fontSize: 64,
        fontFamily: 'DM Serif Display',
        fontStyle: 'normal',
        color: INK,
        fontWeight: 400,
        marginBottom: 16,
        lineHeight: 1.1,
        maxWidth: 900,
      },
    }, page.title),
    // Subtitle
    h('div', {
      style: {
        fontSize: 26,
        fontFamily: 'Inter',
        fontWeight: 400,
        color: MUTED,
        lineHeight: 1.35,
        maxWidth: 800,
      },
    }, page.subtitle),
    // Brand
    h('div', {
      style: {
        position: 'absolute',
        bottom: 40,
        right: 60,
        fontSize: 15,
        fontFamily: 'JetBrains Mono',
        fontWeight: 400,
        color: ACCENT,
        letterSpacing: '0.05em',
      },
    }, 'maxguo.dev'),
  ]);
}

export const GET: APIRoute = async ({ params }) => {
  const page = OG_PAGES.find((p) => p.slug === params.slug);
  if (!page) return new Response('Not found', { status: 404 });

  const svg = await satori(OgTemplate(page), {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: 1200 },
    background: BG,
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': png.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
