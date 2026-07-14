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

interface HeroPage {
  slug: string;
  label: string;
  title: string;
  tagline: string;
  stat: string;
  statLabel: string;
  color: string;
  bgLight: string;
  layer: string;
}

const HERO_PAGES: HeroPage[] = [
  {
    slug: 'pi-discovery',
    label: '01 · Theory',
    title: 'PI Discovery Engine',
    tagline: 'From Research Topics to Investigator Cards',
    stat: 'Semantic Scholar',
    statLabel: '+ OpenAlex · automated PI screening',
    color: '#8A8A82',
    bgLight: '#EDEBE4',
    layer: 'Layer 1',
  },
  {
    slug: 'fitcalib-bench',
    label: '02 · Measurement',
    title: 'MaxFitCalib-Bench',
    tagline: 'A Benchmark for LLM Calibration in Fitness Advice',
    stat: '6.3%',
    statLabel: 'Pseudo-precise failure rate',
    color: '#2D7D6A',
    bgLight: '#E4F0EC',
    layer: 'Layer 2',
  },
  {
    slug: 'checkmycoach',
    label: '03 · Intervention',
    title: 'CheckMyCoach',
    tagline: 'A Calibration Pipeline for LLM Uncertainty Expression',
    stat: '+0.75 UCS',
    statLabel: 'Improvement at ~$0.001/correction',
    color: '#B85A3A',
    bgLight: '#F5E4DC',
    layer: 'Layer 3',
  },
  {
    slug: 'caltrust',
    label: '04 · Adaptation',
    title: 'CalTrust',
    tagline: 'Adaptive Trust Calibration via Contextual Bandits',
    stat: 'AUC 0.70',
    statLabel: 'XGBoost trust predictor · 19.2K trials',
    color: '#B8823A',
    bgLight: '#F0E6D4',
    layer: 'Layer 4',
  },
];

export const getStaticPaths: GetStaticPaths = () => {
  return HERO_PAGES.map((p) => ({ params: { slug: p.slug } }));
};

const W = 1200;
const H = 675;

function HeroTemplate(page: HeroPage) {
  return h('div', {
    style: {
      width: W,
      height: H,
      backgroundColor: '#F5F0E6',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    },
  }, [
    // Colored top band
    h('div', {
      style: {
        width: '100%',
        height: 8,
        backgroundColor: page.color,
      },
    }),
    // Decorative circle (large, semi-transparent)
    h('div', {
      style: {
        position: 'absolute',
        top: -120,
        right: -80,
        width: 400,
        height: 400,
        borderRadius: '50%',
        backgroundColor: page.bgLight,
        opacity: 0.6,
      },
    }),
    // Decorative circle (small)
    h('div', {
      style: {
        position: 'absolute',
        bottom: -60,
        right: 100,
        width: 200,
        height: 200,
        borderRadius: '50%',
        backgroundColor: page.bgLight,
        opacity: 0.4,
      },
    }),
    // Decorative line
    h('div', {
      style: {
        position: 'absolute',
        top: 200,
        right: 200,
        width: 300,
        height: 2,
        backgroundColor: page.color,
        opacity: 0.15,
      },
    }),
    // Content area
    h('div', {
      style: {
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 70px',
      },
    }, [
      // Layer label
      h('div', {
        style: {
          fontFamily: 'JetBrains Mono',
          fontWeight: 400,
          fontSize: 13,
          color: page.color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        },
      }, page.label),
      // Title
      h('div', {
        style: {
          fontFamily: 'DM Serif Display',
          fontWeight: 400,
          fontSize: 56,
          color: '#1A1A18',
          lineHeight: 1.1,
          marginBottom: 10,
          maxWidth: 700,
        },
      }, page.title),
      // Tagline
      h('div', {
        style: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 20,
          color: '#6B6660',
          lineHeight: 1.4,
          marginBottom: 28,
          maxWidth: 600,
        },
      }, page.tagline),
      // Stat card
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          backgroundColor: page.color,
          borderRadius: 10,
          padding: '16px 24px',
          alignSelf: 'flex-start',
        },
      }, [
        h('span', {
          style: {
            fontFamily: 'DM Serif Display',
            fontWeight: 400,
            fontSize: 32,
            color: '#FFFFFF',
            lineHeight: 1,
          },
        }, page.stat),
        h('span', {
          style: {
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.3,
            maxWidth: 200,
          },
        }, page.statLabel),
      ]),
    ]),
    // Bottom brand
    h('div', {
      style: {
        position: 'absolute',
        bottom: 24,
        right: 50,
        fontFamily: 'JetBrains Mono',
        fontWeight: 400,
        fontSize: 12,
        color: page.color,
        opacity: 0.5,
        letterSpacing: '0.05em',
      },
    }, 'maxguo.dev · ' + page.layer),
  ]);
}

export const GET: APIRoute = async ({ params }) => {
  const page = HERO_PAGES.find((p) => p.slug === params.slug);
  if (!page) return new Response('Not found', { status: 404 });

  const svg = await satori(HeroTemplate(page), {
    width: W,
    height: H,
    fonts: FONTS,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: W },
    background: '#F5F0E6',
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
