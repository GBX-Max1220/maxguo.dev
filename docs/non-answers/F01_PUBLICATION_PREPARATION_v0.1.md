# F01｜Stage 2 发行准备合同（未发布）

**状态：RELEASE_PREPARED_ONLY。** 此文件和准备脚本可以合并讨论，但**不能因为作者已审阅就自动发布**。

## 发布目标

- 正式唯一 canonical：`https://gbx-max1220.github.io/maxguo.dev/non-answers/cases/fengxian-evidence-2022/`
- 简体：默认入口。
- 繁体：`?lang=zh-Hant`，英文：`?lang=en`。它们共用同一 canonical；这是动态三语正文，**并非**独立索引的三篇文章，不要宣称已实施独立语种 hreflang SEO。
- 文章身份：作者 Baixin Guo (Max)；一篇可核查公共文本和证据边界的独立研究文章，不声称社会影响测量、最终司法终审或者首度揭露事实。
- 图片：专门的 `1200×630` PNG 封面 `assets/og-f01.png`，社交卡默认简体；题名、介绍、图片 URL、Twitter Card 等已在“发行准备副本”中演示。
- 站内入口：`public/non-answers/index.html` 的 F01 旗舰案例卡，提供简、繁、英三种真正独立的跳转 URL。
- Sitemap：`astro.config.mjs` 的 `customPages` 必须手动新增上述 canonical；Astro 通常不会把 public/ 下的纯静态文件自动列入生成页面清单。

## 当前 Draft 安全边界

新脚本 `node scripts/prepare-non-answers-f01-publication.mjs --preview` **只有 --preview 模式**。它只写入 `.astro/f01-publication-preparation/`；其中生成的 indexable 页面、站内入口、sitemap 提议和 OG 图片**仅供离线验收，不能未经批准托管到线上**。

源代码现状必须继续满足：

- F01 页面 `noindex,nofollow`；不包含正式 canonical。
- 专题首页没有 F01 入口。
- `astro.config.mjs` 未加入 F01 sitemap URL。
- GitHub PR #15 仍 Draft，`main` 未合并；Cloudflare Preview branches 构建保持关闭。
- 新增或变更 Draft 之后再次读取生产 Worker Active Deployment，避免曾经发生的 PR 覆盖生产事故。

## 正式发布需新授权并实施

1. 保留七来源 provenance 限制和“涉嫌／调查认定／一审”的法律阶段边界。将独立英繁校对、第二人核查及屏幕阅读器测验的实际状态如实标注；未做的不能写 PASS。
2. 在获得正式上线明确授权后，把构建副本的 F01 index、专题入口、OG PNG 和 sitemap 提议**明确落实成新的 Git 提交**。保留 release candidate artifacts 供比对。
3. 更新原 F01 CI 脚本的 `noindex`／`unlinked` 发布前断言，另设“正式发布后应有 canonical、robots index、站内入口、sitemap、PNG 图片”的断言。**不能绕过 CI**。
4. 明确告知：当前 `main` 推送可能同时触发 GitHub Pages 和 Cloudflare Production 部署；**合并不是可与发布分离的无副作用操作**。
5. 只有获得合并／生产部署的单独授权，且最终 release commit CI 通过后才进行操作；完毕后验证站点可达、图片可达、robots、canonical、站内入口、生产 Worker 版本。

**当前不执行第 2 至第 5 步；以上仅是准备工作。**

## 2026-10-18 Release-source candidate amendment (still Draft)

The actual Draft source now contains a F01 sitemap entry, a multilingual feature card, the case page's release-state title, canonical and Open Graph, and a dedicated 1200×630 PNG. This is **pre-merge code**, not an authorized publication. The evidence register's status is now the time-independent descriptor `PUBLIC_EVIDENCE_REPORT` (not a false claim that the site has already launched). Publication-state source tests supersede the original noindex/unlinked draft-only tests. The old `--preview` generator remains an archival preparation tool and is **not invoked by release-source CI**. Live deployment is a separate, explicitly authorized step.
