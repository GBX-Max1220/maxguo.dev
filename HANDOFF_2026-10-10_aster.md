# Handoff — maxguo.dev 内容结构与视觉更新

TASK: 网站内容结构与视觉更新（首页五部分、Research/Outputs 调整、配色、SVG 图形、验证）
AGENT: Aster (WorkBuddy)
MODEL: hy4-preview
STATUS: COMPLETED (local implementation + validation; no push / PR / deploy)
STARTED_AT: 2026-10-10T03:46:00+08:00
COMPLETED_AT: 2026-10-10T04:45:00+08:00
BASE_COMMIT: 275251a75ac40af722c38461d30af3ad19a4e548 (verified via `git ls-remote origin` before fetch; local origin/main was behind)
FINAL_COMMIT: eaa8fcb (branch `redesign/research-os-v2a2-aster`, worktree `D:\Documents_legacy\Codex\projects\mgd-aster-20261010`)

## CHANGED

- src/pages/index.astro — 重写为五部分：身份+研究问题 hero / Selected Research / Engineering & open source / Recent activity (3 条) / Collaboration
- src/components/SelectedResearch.astro（新）— 一主两辅布局，含问题/贡献/结果/范围/入口
- src/components/EngineeringList.astro（新）— REEF merged PR、SkillRL open PR、future-agi open issue
- src/components/Collaboration.astro（新）
- src/components/ActivityLog.astro — Recent activity 从 4 条改为 3 条
- src/data/research-profile.json — 新增 headline 短句、selectedResearch / engineeringContributions / collaboration 配置；未删除 collaborations/projects/additional 历史数据
- src/pages/research.astro — 议程重组为三个问题（测量 / 状态一致性 / 适应迁移）+ 显式 open bridge callout；How I work 移到本页
- src/pages/publications/index.astro — "All Manuscripts" 改为 "Public reports and research artifacts"；归档独立分组
- src/content/publication/preference-modeling-diagnostics.json（新）— status `artifact`，不伪装成论文
- src/content/config.ts、src/lib/publications.ts、scripts/validate-content.mjs — 新增 `artifact` 状态
- src/styles/globals.css — 配色：blue #3155D9（结构/链接）、coral #E36D5A（点缀）、page #F8F6F1、brand-subtle #EEF2FF
- src/pages/research/building-trustworthy-ai/authority-enforcement/index.astro — fig-inline-link 改蓝色（链接语义）
- public/images/research/\*.svg（新）— 三个静态 SVG 图形（概念示意，无数值 claim；PMD 图含已发表的 0.879% 数值，来源为冻结 artifact）
- scripts/validate-build.mjs — 首页选择检查改为匹配 profile.selectedResearch（旧检查依赖已移除的 data-selected-id）
- scripts/overflow-only.mjs、screenshot-review.mjs、shot-authority.mjs（新）— 本地验证/截图辅助脚本

## NOT CHANGED

- 原工作区（`D:\Documents_legacy\Codex\projects\maxguo.dev`）的所有 Owner 未提交修改（NoteTable、figures、Authority note 页、building-trustworthy-ai index 等）——未触碰、未吸收
- contributions.json — 22 条记录与生命周期完全未动
- About / Now / Projects / 技术详情页 — 未大范围重写
- 全部现有 URL、锚点、外部链接 — validate-build 内链检查通过

## VALIDATION

- `npm run build` — 成功；dist 中 CSS 实际输出并被页面引用（`_astro/index.*.css`，img/link 带 /maxguo.dev 前缀）
  - 注意：一次构建后出现 img 前缀缺失，手动重跑 `node scripts/prefix-base.mjs` 修复。原因可能是 build 管道中 safe-delete shim 报错干扰。后续构建请确认看到 `[prefix-base] Prefixed N HTML files` 输出。
- `npm run validate:content` — 全绿（5 publications、7 projects、22 contribution events）
- `npm run validate` — 除两项外全绿：
  - ❌ "Contribution route included in sitemap" — **基线问题**：本环境构建不产出 sitemap-index.xml（worktree 基线构建同样缺失），非本次引入
  - ✅ "Homepage selected research matches profile curation"（新检查，通过）
- `npm run test:contributions` — 12/13 通过；第 13 项失败 `spawnSync node.exe EBUSY`，与已知基线失败一致（非本次引入）
- 横向溢出 — 自写 overflow-only.mjs：320/390/768/1440 四档 × 首页/Research/Outputs/Contributions，全部无溢出
- 截图 — `.astro/review-2026-10-10/` 下 13 张 PNG（home/research/publications × mobile/desktop × top/full + authority-desktop-top.png），已人工目检首页与 Authority 页
- Playwright chromium-headless-shell 在本机有 GPU 崩溃问题，截图脚本需 `--disable-gpu --no-sandbox` 参数
- repo 的 `npm run check:overflow` 在本机反复挂起（原因同上浏览器崩溃），未取得全绿记录；以自写脚本结果替代

## 三项代表研究最终文案（首页）

1. **What the Score Measured**（主展示，Boundary Labs）：问题——任务失败时 outcome score 能否指出哪个组件失败；贡献——共设计 observability map（分离 outcomes/evidence/attribution/judge confidence），合著公开预印本；结果——trace 缺失时 outcome score 无法定位失败组件；范围——LongMemEval-based，claims 限于 inspected + collaborator-reported evidence；入口——Zenodo preprint
2. **Preference Modeling Diagnostics**（辅助）：问题——known-user 偏好能否迁移到未见 prompt；贡献——prompt-disjoint 评估 + identity controls；结果——held-out prompts 上 equal-user NLL 降低 0.879%，wrong-user/shuffled 对照消除优势；范围——CPU-only，94 eligible users，适用 tested prompt distribution；入口——frozen artifact
3. **Cross-Consumer Authority Enforcement**（辅助）：问题——同一 canonical authority decision 是否被所有 consumer path 一致执行；贡献——将既有冻结证据整合为公开研究 note；结果——单一 audited substrate 内出现跨 consumer 执行分歧；范围——single substrate，note 未报告新实验，无跨系统 claim；入口——站内 research note

## KNOWN ISSUES / FOLLOW-UP

- sitemap 未生成（基线问题）→ 建议单独排查 @astrojs/sitemap 输出
- check-overflow 原脚本在本机不稳定 → 建议给其 chromium.launch 加 `--disable-gpu` 并把截图与检查拆分（overflow-only.mjs 已是可行替代）
- prefix-base.mjs 偶发未生效 → 建议在 CI/部署前 assert img src 含 base 前缀
- Homepage hero 图沿用旧 conceptual PNG；若后续需要与研究议程对齐可重绘

## 保留的 Owner 修改

全部保留在原工作区，未合并、未覆盖。若 Owner 后续提交这些修改，与本分支的 index.astro / research.astro 改动可能冲突，建议先 review Owner diff 再 rebase。

## 后续建议

1. Push + PR + 部署（本次未做）
2. 用真实浏览器（非 headless shell）复核一次视觉细节
3. Research 页的 "How I work" 若嫌长可再压缩
