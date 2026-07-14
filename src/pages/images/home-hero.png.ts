import { createElement as h } from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';

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

const LAYERS = [
  { label: 'Theory', color: '#8A8A82', pct: 95 },
  { label: 'Measurement', color: '#2D7D6A', pct: 90 },
  { label: 'Intervention', color: '#B85A3A', pct: 85 },
  { label: 'Adaptation', color: '#B8823A', pct: 80 },
  { label: 'Infrastructure', color: '#5A7D6E', pct: 75 },
];

const W = 1200;
const H = 500;

function HomeHero() {
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
    // Top accent stripe
    h('div', {
      style: { width: '100%', height: 6, backgroundColor: '#B85A3A' },
    }),
    // Decorative large circle
    h('div', {
      style: {
        position: 'absolute',
        top: -100,
        right: -60,
        width: 350,
        height: 350,
        borderRadius: '50%',
        backgroundColor: '#E4F0EC',
        opacity: 0.5,
      },
    }),
    // Decorative small circle
    h('div', {
      style: {
        position: 'absolute',
        bottom: -50,
        right: 150,
        width: 150,
        height: 150,
        borderRadius: '50%',
        backgroundColor: '#F5E4DC',
        opacity: 0.4,
      },
    }),
    // Content
    h('div', {
      style: {
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '40px 60px',
        gap: 40,
      },
    }, [
      // Left: text + title
      h('div', {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        },
      }, [
        // Tag
        h('div', {
          style: {
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
            fontWeight: 400,
            color: '#B85A3A',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 8,
          },
        }, 'Precision Illusion'),
        // Title
        h('div', {
          style: {
            fontFamily: 'DM Serif Display',
            fontSize: 44,
            fontWeight: 400,
            color: '#1A1A18',
            lineHeight: 1.15,
            marginBottom: 10,
          },
        }, 'From Theory to\nInfrastructure'),
        // Subtitle
        h('div', {
          style: {
            fontFamily: 'Inter',
            fontSize: 17,
            fontWeight: 400,
            color: '#6B6660',
            lineHeight: 1.4,
            marginBottom: 20,
          },
        }, 'A five-layer research stack on how AI systems\nmislead through false precision'),
        // Tagline
        h('div', {
          style: {
            fontFamily: 'Inter',
            fontSize: 13,
            fontWeight: 600,
            color: '#2D7D6A',
            fontStyle: 'italic',
          },
        }, 'measure → fix → prevent'),
      ]),
      // Right: 5-layer bars
      h('div', {
        style: {
          flexShrink: 0,
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        },
      }, LAYERS.map((layer) =>
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          },
        }, [
          // Layer label
          h('span', {
            style: {
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              fontWeight: 400,
              color: '#807C74',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              width: 100,
              flexShrink: 0,
              textAlign: 'right' as const,
            },
          }, layer.label),
          // Bar
          h('div', {
            style: {
              flex: 1,
              height: 22,
              backgroundColor: '#E5DFD6',
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
            },
          }, [
            h('div', {
              style: {
                width: `${layer.pct}%`,
                height: '100%',
                backgroundColor: layer.color,
                borderRadius: 4,
                opacity: 0.85,
              },
            }),
          ]),
        ])
      )),
    ]),
    // Bottom brand
    h('div', {
      style: {
        position: 'absolute',
        bottom: 18,
        right: 40,
        fontFamily: 'JetBrains Mono',
        fontSize: 11,
        fontWeight: 400,
        color: '#B85A3A',
        opacity: 0.4,
        letterSpacing: '0.04em',
      },
    }, 'maxguo.dev'),
  ]);
}

export const GET: APIRoute = async () => {
  const svg = await satori(HomeHero(), {
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
