/**
 * Reproducible Open Graph image for The Language of Non-Answers.
 * Run after npm ci + npx playwright install chromium-headless-shell.
 * Generates a 1200x630 PNG; never touches production or git.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = 'public/non-answers/og-preview.png';
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:'Noto Sans CJK SC','Noto Sans CJK',sans-serif;color:#24251f;background:#efeae0}
.canvas{position:relative;width:1200px;height:630px;overflow:hidden;background:linear-gradient(122deg,#f9f6ef 0%,#f0e9da 77%,#e7dfce 100%)}
.canvas:before{content:"";position:absolute;top:0;left:0;right:0;height:14px;background:#ac4d2c}
.grid{position:absolute;top:40px;right:-120px;width:450px;height:660px;opacity:.13;transform:rotate(-19deg);background:repeating-linear-gradient(90deg,transparent 0 35px,#b16345 36px 37px),repeating-linear-gradient(0deg,transparent 0 35px,#b16345 36px 37px)}
.arc{position:absolute;right:-175px;top:130px;width:500px;height:500px;border:65px solid rgba(171,74,43,.10);border-radius:50%}
.content{position:absolute;top:72px;left:87px;right:70px;bottom:55px}
.eyebrow{font-size:17px;letter-spacing:.21em;font-weight:600;color:#9f482a}
.rule{width:68px;height:4px;background:#ab4e2e;margin-top:19px;margin-bottom:28px}
.zh{font-family:'Noto Serif CJK SC','Noto Serif CJK',serif;letter-spacing:.11em;font-weight:700;line-height:1.25;font-size:94px;margin:0;color:#20221f}
.en{font-family:Georgia,serif;font-size:33px;font-style:italic;letter-spacing:.015em;color:#91472f;margin:17px 0 0}
.sub{font-size:22px;line-height:1.5;letter-spacing:.05em;color:#4d5149;margin-top:33px}
.footer{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(87,74,62,.28);padding-top:17px;font-size:15px;letter-spacing:.03em;color:#66665c}
.footer strong{font-weight:700;color:#2d2c29}.right{font-size:14px;color:#91472f}
</style><body><div class="canvas"><div class="grid"></div><div class="arc"></div><div class="content"><div class="eyebrow">语言 · 证据 · 公共表达</div><div class="rule"></div><h1 class="zh">正确的废话</h1><p class="en">The Language of Non-Answers</p><p class="sub">说了什么，没回答什么？</p><div class="footer"><span><strong>Baixin Guo (Max)</strong> · Evidence-led interactive essay</span><span class="right">18 份文本&nbsp; / &nbsp;139 项信息需求</span></div></div></div></body></html>`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(async () => document.fonts.ready);
  mkdirSync('public/non-answers', { recursive: true });
  await page.screenshot({ path: out, animations: 'disabled' });
  console.log('Generated ' + out + ' at 1200x630');
} finally {
  await browser.close();
}
