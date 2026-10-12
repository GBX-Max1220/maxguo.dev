# 《正确的废话》V1.8｜青年失业率统计口径专题

**发布决策：2026-10-12 用户明确授权公开发布与合并 PR #12。**  
**上线目标：** `/maxguo.dev/non-answers/cases/youth-unemployment-2023/`  
**证据边界：** 独立案例，不纳入 V1.7 冻结的 18 份文本及 139 项信息需求。

## 已实现内容

- 中文简体、逐项编写的繁体中文与英文版本，含语言继承与无障碍描述。
- 比较判断：2023 年 6 月旧口径 21.3% 与 2023 年 12 月新口径 14.9% **不可直接比较**；不绘制趋势连线。
- 2023 年暂停分年龄组数据、2024 年新定义恢复的时间线，以及失业率分母定义切换。
- 2023-08-15 彭博社完整问答的分项 X 光片，包含 70 城房价趋势的未回应部分。
- 合理方法解释、仍待公开的桥接数据、不可据此证明造假的限制。
- 六份国家统计局原始来源和可检查的 `evidence.json`。
- 在 V1.7 主文章下方新增三语入口卡片；专题复用已验证的 OG 分享封面，附独立分享元信息。

## 发布验收状态

- [x] 所有事实边界、原文问项和数字口径检查已完成。
- [x] 已有 320、375、390、768、1366、1440 px 响应式回归及 Chromium 截图检查。
- [x] 三语切换与深链接回归；修复了主文章繁体「畫」及英文导航漏译。
- [x] 获得作者/所有者在 2026-10-12 的明确上线与合并授权。
- [x] 上线补丁准备：移除案例页 `noindex,nofollow` 与原型/未批准提示；状态改为公开案例。
- [ ] 上线补丁精确 HEAD CI 全绿（须以 GitHub Actions 核实）。
- [ ] PR #12 合并 `main`、GitHub Pages 部署成功、正式 URL 内容可访问。
- [ ] 独立繁体母语编辑复核：**未单独委任**，不宣称已完成。用户批准的是已提供的文本；发现问题可继续公开纠错。
- [ ] 外部社交平台缓存和微信预览：发布后才能最终确认，CI 不能模拟实际缓存。

## 不应声称的内容

1. 21.3% → 14.9% 是可比较的 6.4 个百分点改善。
2. 暂停分年龄组指标意味着暂停所有就业统计。
3. 当前证据已经证明官方有意造假或隐瞒。
4. 本案例可以代表全部中国官方统计和话语。

## Primary sources

S01 https://www.stats.gov.cn/sj/zxfb/202307/t20230715_1941271.html  
S02 https://www.stats.gov.cn/sj/sjjd/202308/t20230815_1942020.html  
S03 https://www.stats.gov.cn/sj/sjjd/202309/t20230915_1942890.html  
S04 https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202401/t20240117_1946639.html  
S05 https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202401/t20240117_1946644.html  
S06 https://www.stats.gov.cn/hd/lyzx/zxgk/202406/t20240619_1955075.html

**Research identity:** public-facing critique of information sufficiency, statistical definitions and the relationship between official language and observable reality. This prototype does not launch a new ML research project.