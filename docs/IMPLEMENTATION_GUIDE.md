# 历知 ChronoSina — 实施指南

> 本文档是平台功能的完整实施手册。按阶段执行，每个步骤都有具体的文件路径、数据模型和实现细节。

---

## 目录

1. [项目现状与目标架构](#1-项目现状与目标架构)
2. [阶段 1A：SRS 复习引擎](#2-阶段-1asrs-复习引擎)
3. [阶段 1B：PWA 离线 + 词汇数据导出](#3-阶段-1bpwa-离线--词汇数据导出)
4. [阶段 1C：SEO + 新用户引导 + 数据分析](#4-阶段-1cseo--新用户引导--数据分析)
5. [阶段 2A：用户认证 + 数据库](#5-阶段-2a用户认证--数据库)
6. [阶段 2B：进度同步 + 付费系统](#6-阶段-2b进度同步--付费系统)
7. [阶段 3：AI 问答 + 社区](#7-阶段-3ai-问答--社区)
8. [CI/CD + 部署 + 成本](#8-cicd--部署--成本)

---

## 1. 项目现状与目标架构

### 1.1 现有代码资产

```
article/
├── _config.yml                    # Hexo 主配置 (URL: gouhongshen-gmail.github.io/article.github.io)
├── _config.fluid.yml              # Fluid 主题配置 (自定义 CSS/JS 注入)
├── package.json                   # Hexo 8.1.1, Node 20
├── scripts/
│   └── tags/
│       └── cnlesson.js            # ⭐ cnlesson 标签插件 (195行, YAML→HTML)
├── source/
│   ├── _posts/
│   │   ├── grand-canal.md         # ⭐ 使用 cnlesson 标签
│   │   ├── mandate-of-heaven.md   # ⭐ 使用 cnlesson 标签
│   │   ├── memoria-agent-memory.md
│   │   └── hello-world.md
│   ├── js/
│   │   ├── chinese-learning.js    # ⭐ 交互核心 (431行, 弹窗/音频/切换)
│   │   └── comments.js            # ⭐ 评论系统 (207行, Cloudflare Worker)
│   └── css/
│       ├── chinese-learning.css   # ⭐ 课程样式 (399行, 含暗色模式)
│       ├── comments.css           # 评论样式 (221行)
│       └── custom.css             # 全局样式 (287行, 布局/字体)
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions: hexo generate → gh-pages
└── docs/
    ├── PLATFORM_VISION.md         # 愿景文档 (1411行)
    └── REVIEW_SYNTHESIS.md        # 评审综合 (470行)
```

### 1.2 已有功能清单

| 功能 | 文件 | 工作原理 |
|------|------|---------|
| 中文词汇弹窗 | `chinese-learning.js` | 点击 `[data-cn-token]` → 创建浮窗 → 显示拼音/释义/音频 |
| 句子中英切换 | `chinese-learning.js` | 点击 `.cn-lesson__toggle` → 展开/收起中文翻译 |
| 语音朗读 | `chinese-learning.js` | Web Speech API，优先选择中文声音，语速 0.96 |
| 音频文件播放 | `chinese-learning.js` | 优先 MP3 URL，失败后 fallback 到 Web Speech |
| 评论系统 | `comments.js` | GET/POST 到 Cloudflare Worker + Turnstile 验证 |
| 暗色模式 | `chinese-learning.css` | `prefers-color-scheme: dark` + `[data-user-color-scheme="dark"]` |
| CI/CD 部署 | `deploy.yml` | push main → npm install → hexo generate → deploy gh-pages |

### 1.3 目标架构（三阶段）

```
阶段 1（$0/月）                     阶段 2（~$5/月）                  阶段 3（~$20-50/月）
┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
│   静态站点增强    │              │   用户系统 + 付费  │              │   AI + 社区       │
│                  │              │                  │              │                  │
│ ✦ SRS 复习引擎   │              │ ✦ Workers Auth    │              │ ✦ AI 文章问答     │
│   (IndexedDB)    │              │   (Magic Link +   │              │   (LLM API)      │
│ ✦ PWA 离线缓存   │              │    Google OAuth)  │              │ ✦ Discourse 论坛  │
│ ✦ 词汇 JSON 导出 │    ──────▶   │ ✦ D1 数据库       │   ──────▶   │   (Oracle ARM)   │
│ ✦ SEO 增强       │              │ ✦ Stripe 付费     │              │ ✦ 邮件通知        │
│ ✦ 新用户引导     │              │ ✦ 进度云同步       │              │   (Resend)       │
│ ✦ 邮件订阅       │              │ ✦ R2 音频存储      │              │ ✦ 实时协作        │
└──────────────────┘              └──────────────────┘              └──────────────────┘
 Hexo + Vanilla JS                 + Cloudflare D1/R2               + Oracle Cloud
 Cloudflare Pages                  + Stripe                         + LLM API
 GitHub Actions                                                     + Resend
```

### 1.4 新增文件规划

```
source/
├── js/
│   ├── chinese-learning.js    # 已有 — 不改动
│   ├── comments.js            # 已有 — 加分页 + 限流
│   ├── srs-engine.js          # 新增 — SRS 复习引擎
│   ├── onboarding.js          # 新增 — 新用户引导
│   └── service-worker.js      # 新增 — PWA 离线缓存
├── css/
│   ├── chinese-learning.css   # 已有 — 不改动
│   ├── srs.css                # 新增 — SRS 复习界面样式
│   └── onboarding.css         # 新增 — 引导界面样式
scripts/
├── tags/
│   └── cnlesson.js            # 已有 — 不改动
├── plugins/
│   └── vocabulary-manifest.js # 新增 — hexo generate 时提取词汇数据
workers/                       # 新增 — Cloudflare Workers 源码（阶段 2）
├── api/
│   ├── auth.js                # 用户认证
│   ├── progress.js            # 进度同步
│   ├── stripe-webhook.js      # Stripe 回调
│   └── ai.js                  # AI 问答（阶段 3）
├── schema.sql                 # D1 数据库 schema
└── wrangler.toml              # Workers 配置
```

---

## 2. 阶段 1A：SRS 复习引擎

> **目标**：用户点击文章中的词汇即可保存，保存的词汇进入间隔复习队列。全部在客户端完成，无需后端。
> **工作量**：3-5 天
> **文件**：`source/js/srs-engine.js` + `source/css/srs.css`

### 2.1 SM-2 算法说明

SM-2 是经过验证的间隔重复算法（Anki 也基于此）：

```
输入：用户对一个词的评分 quality (0-5)
  0 = 完全不记得
  1 = 错误但看到答案后有印象
  2 = 错误但觉得差一点就想起来了
  3 = 正确但很费劲
  4 = 正确且有些犹豫
  5 = 完美回忆

算法：
  if quality >= 3:  // 回忆成功
    if repetitions == 0: interval = 1 天
    if repetitions == 1: interval = 6 天
    else: interval = round(interval * easeFactor)
    repetitions += 1
  else:  // 回忆失败
    repetitions = 0
    interval = 1 天

  // 更新难度因子
  easeFactor = max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  nextReview = today + interval
```

### 2.2 IndexedDB 数据模型

```javascript
// 数据库名: chronosina-srs
// 版本: 1

// Store: vocabulary
{
  id: "yunhe",                    // 唯一 ID（拼音拼写，无声调）
  text: "运河",                   // 中文
  pinyin: "yùnhé",               // 拼音
  gloss: "canal",                // 英文释义
  note: "Grand Canal = 大运河",   // 备注（可选）
  audioUrl: null,                // 音频 URL（可选）
  sourceArticle: "/2025/03/15/grand-canal/",  // 来源文章路径
  
  // SRS 状态
  repetitions: 0,                // 连续正确次数
  easeFactor: 2.5,               // 难度因子（初始 2.5）
  interval: 0,                   // 当前间隔（天）
  nextReview: "2025-03-16",      // 下次复习日期 (YYYY-MM-DD)
  lastReview: null,              // 上次复习日期
  
  // 元数据
  savedAt: "2025-03-15T10:30:00Z",
  reviewCount: 0,                // 总复习次数
  correctCount: 0,               // 正确次数
}

// Store: reviewLog（复习日志，用于数据分析）
{
  id: auto,                      // 自增
  wordId: "yunhe",
  quality: 4,                    // 用户评分 0-5
  timestamp: "2025-03-16T08:00:00Z",
  responseTime: 3200,            // 响应时间（毫秒）
}

// Store: settings
{
  key: "dailyGoal",              // 每日目标词数
  value: 10
}
```

### 2.3 核心 API 设计

```javascript
// source/js/srs-engine.js 导出的公共接口

const SRS = {
  // === 词汇管理 ===
  saveWord(word),          // 从弹窗保存词汇 → IndexedDB
  removeWord(wordId),      // 删除已保存词汇
  getWord(wordId),         // 查询单个词汇
  getAllWords(),            // 获取全部已保存词汇
  getWordCount(),          // 已保存总数

  // === 复习 ===
  getDueWords(limit=10),   // 获取今日到期的词汇（按 nextReview <= today）
  getDueCount(),           // 今日待复习数量
  reviewWord(wordId, quality),  // 提交复习结果（0-5），更新 SRS 状态

  // === 统计 ===
  getStats(),              // 返回 { total, due, learned, learning, new }
  getReviewHistory(days=30), // 最近 N 天的复习记录

  // === 数据导出 ===
  exportToJSON(),          // 导出所有数据为 JSON（备份/迁移用）
  importFromJSON(data),    // 从 JSON 导入
};
```

### 2.4 与现有代码的集成方式

**关键集成点：在弹窗中添加"保存"按钮**

现有 `chinese-learning.js` 的 `openTokenPopover()` 函数创建弹窗，显示拼音/释义/音频。集成方式：

```
修改位置：chinese-learning.js → openTokenPopover() 函数
修改内容：在弹窗 HTML 中添加一个"保存"按钮

弹窗现有结构：
┌─────────────────────────┐
│  运河  yùnhé            │
│  canal                  │
│  🔊 播放                │
└─────────────────────────┘

集成后结构：
┌─────────────────────────┐
│  运河  yùnhé            │
│  canal                  │
│  🔊 播放    ⭐ 保存/已存 │
└─────────────────────────┘
```

**集成代码位置**（不改动 chinese-learning.js 的 IIFE 结构）：

```javascript
// 在 srs-engine.js 中：

// 1. 监听弹窗创建事件（通过 MutationObserver 或全局事件）
// 2. 当弹窗出现时，注入"保存"按钮
// 3. 按钮点击 → SRS.saveWord() → 按钮变为"已存 ✓"

// 具体实现：监控 .cn-lesson__popover 的出现
function injectSaveButton(popover) {
  const word = popover.querySelector('.cn-lesson__popover-word')?.textContent;
  const pinyin = popover.querySelector('.cn-lesson__popover-pinyin')?.textContent;
  const gloss = popover.querySelector('.cn-lesson__popover-gloss')?.textContent;
  
  const btn = document.createElement('button');
  btn.className = 'srs-save-btn';
  btn.textContent = SRS.hasWord(wordId) ? '已存 ✓' : '⭐ 保存';
  btn.addEventListener('click', async () => {
    await SRS.saveWord({ text: word, pinyin, gloss, ... });
    btn.textContent = '已存 ✓';
    btn.classList.add('is-saved');
  });
  
  popover.querySelector('.cn-lesson__popover-card').appendChild(btn);
}
```

### 2.5 复习界面设计

**入口位置：** 首页（或文章底部）显示"每日复习"卡片。

```
┌─────────────────────────────────────────────┐
│  📖 每日复习                     12 词待复习  │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │                                       │   │
│  │            运  河                      │   │
│  │                                       │   │
│  │         (点击显示答案)                  │   │
│  │                                       │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  [显示答案]                                   │
│                                              │
│  ── 显示答案后 ──                             │
│                                              │
│  运河  yùnhé                                  │
│  canal                                       │
│  来源：大运河                                  │
│  🔊 播放发音                                  │
│                                              │
│  [忘了😣] [费劲😅] [记得😊] [简单😎]          │
│   (q=1)   (q=3)    (q=4)    (q=5)           │
│                                              │
│  进度：3/12 ━━━━━━━░░░░░░░░░░░              │
└─────────────────────────────────────────────┘
```

**按钮映射到 SM-2 评分：**
- 忘了 → quality = 1（错误，看答案后有印象）
- 费劲 → quality = 3（正确但很费劲）
- 记得 → quality = 4（正确且较确定）
- 简单 → quality = 5（完美回忆）

### 2.6 数据持久化策略

```
写入时机：
- 保存词汇 → 立即写入 IndexedDB
- 复习评分 → 立即写入 IndexedDB（防断电丢失）
- 复习日志 → 立即写入（后续数据分析用）

读取时机：
- 页面加载 → 读取待复习数量（显示在首页/导航栏）
- 弹窗打开 → 检查该词是否已保存（显示"保存"或"已存"）
- 进入复习页 → 读取所有 nextReview <= today 的词汇

注意事项：
- 所有操作使用 IndexedDB 事务保证原子性
- 每次状态变更立即 persist（不做批量写入，防止断电丢失数据）
- 阶段 2 加入云同步时，本地数据作为 source of truth，上行同步到 D1
```

---

## 3. 阶段 1B：PWA 离线 + 词汇数据导出

### 3.1 Service Worker 设计

> **文件**：`source/service-worker.js`（注意：放在 source 根目录，不是 js 子目录，这样它的 scope 覆盖整个站点）
> **工作量**：1-2 天

#### 缓存策略

```
三层缓存：

1. App Shell（预缓存，安装时下载）
   - /css/chinese-learning.css
   - /css/custom.css
   - /css/srs.css
   - /js/chinese-learning.js
   - /js/srs-engine.js
   - /offline.html （离线回退页面）
   版本化：缓存名带版本号 chronosina-shell-v1

2. 文章内容（运行时缓存，Stale-While-Revalidate）
   - 匹配: /202*/**/*.html (文章页面)
   - 策略: 优先返回缓存，后台更新
   - 上限: 50 篇文章
   - 过期: 30 天自动清理最旧的
   
3. 静态资源（运行时缓存，Cache First）
   - 匹配: CDN 字体、图片
   - 策略: 有缓存直接用，无缓存再请求
   - 上限: 100 个资源
```

#### Service Worker 核心逻辑

```javascript
// source/service-worker.js 伪代码

const SHELL_CACHE = 'chronosina-shell-v1';
const CONTENT_CACHE = 'chronosina-content-v1';
const STATIC_CACHE = 'chronosina-static-v1';

const SHELL_URLS = [
  '/css/chinese-learning.css',
  '/css/custom.css',
  '/css/srs.css',
  '/js/chinese-learning.js',
  '/js/srs-engine.js',
  '/offline.html',
];

// 安装：预缓存 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== SHELL_CACHE && key !== CONTENT_CACHE && key !== STATIC_CACHE)
        .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // App Shell → Cache First
  if (SHELL_URLS.some(u => url.pathname.endsWith(u))) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // 文章页 → Stale While Revalidate
  if (url.pathname.match(/\/\d{4}\/\d{2}\/\d{2}\/.+\//)) {
    event.respondWith(staleWhileRevalidate(event.request, CONTENT_CACHE));
    return;
  }

  // CDN 资源 → Cache First
  if (url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 其他请求 → Network First, 离线时显示 fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/offline.html'))
  );
});
```

#### PWA Manifest

```json
// source/manifest.json
{
  "name": "历知 ChronoSina",
  "short_name": "ChronoSina",
  "description": "Learn Chinese through history",
  "start_url": "/article.github.io/",
  "scope": "/article.github.io/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#1e293b",
  "icons": [
    { "src": "/images/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/images/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### 注册 Service Worker

在 `_config.fluid.yml` 的 `custom_js` 中无法注册 SW（需要在页面顶部注册），改为在 `custom_head` 中加入：

```html
<!-- _config.fluid.yml → custom_head 追加 -->
<link rel="manifest" href="/article.github.io/manifest.json">
<meta name="theme-color" content="#1e293b">
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/article.github.io/service-worker.js');
  });
}
</script>
```

### 3.2 词汇数据导出插件

> **文件**：`scripts/plugins/vocabulary-manifest.js`
> **工作量**：1 天
> **作用**：在 `hexo generate` 时，解析所有文章中的 cnlesson 标签，提取词汇数据，生成结构化 JSON 文件。

#### 输出文件

```
public/
├── api/
│   ├── vocabulary.json       # 全部词汇（去重合并）
│   └── articles-meta.json    # 文章元数据（标题、路径、词汇数、难度）
```

#### vocabulary.json 格式

```json
{
  "version": 1,
  "generatedAt": "2025-03-15T10:00:00Z",
  "totalWords": 45,
  "words": [
    {
      "id": "yunhe",
      "text": "运河",
      "pinyin": "yùnhé",
      "gloss": "canal",
      "note": null,
      "articles": ["/2025/03/15/grand-canal/"],
      "frequency": 1
    }
  ]
}
```

#### articles-meta.json 格式

```json
{
  "version": 1,
  "articles": [
    {
      "path": "/2025/03/15/grand-canal/",
      "title": "The Grand Canal",
      "date": "2025-03-15",
      "wordCount": 25,
      "tags": ["infrastructure", "sui-dynasty"],
      "difficulty": "intermediate"
    }
  ]
}
```

#### 插件实现原理

```javascript
// scripts/plugins/vocabulary-manifest.js

// Hexo 的 after_generate 事件：在所有文件生成后执行
hexo.extend.filter.register('after_generate', function () {
  const allWords = new Map(); // 去重用
  const articlesMeta = [];

  // 遍历所有已渲染的文章
  this.locals.get('posts').forEach(post => {
    // 用正则从原始 markdown 中提取 cnlesson 块
    const cnlessonBlocks = extractCnlessonBlocks(post.raw);
    
    if (cnlessonBlocks.length === 0) return;

    const articleWords = [];
    cnlessonBlocks.forEach(block => {
      // 解析 YAML 中的 segments
      const segments = parseSegments(block);
      segments.forEach(seg => {
        const wordId = generateId(seg.text); // 拼音→ASCII
        if (!allWords.has(wordId)) {
          allWords.set(wordId, {
            id: wordId,
            text: seg.text,
            pinyin: seg.pinyin,
            gloss: seg.gloss,
            note: seg.note || null,
            articles: [],
            frequency: 0,
          });
        }
        const word = allWords.get(wordId);
        word.articles.push(post.path);
        word.frequency++;
        articleWords.push(wordId);
      });
    });

    articlesMeta.push({
      path: post.path,
      title: post.title,
      date: post.date.format('YYYY-MM-DD'),
      wordCount: articleWords.length,
      tags: post.tags.map(t => t.name),
      difficulty: guessDifficulty(articleWords.length),
    });
  });

  // 写入 JSON 文件到 public/api/
  const vocabData = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalWords: allWords.size,
    words: [...allWords.values()],
  };

  // 使用 hexo.route.set 写入
  this.route.set('api/vocabulary.json', JSON.stringify(vocabData));
  this.route.set('api/articles-meta.json', JSON.stringify({ version: 1, articles: articlesMeta }));
});
```

#### 用途

这个 JSON 文件是多个后续功能的数据基础：

| 功能 | 如何使用 vocabulary.json |
|------|------------------------|
| SRS 引擎 | 保存词汇时从 JSON 读取完整元数据 |
| 搜索功能 | 客户端全文搜索（阶段 1 不需要后端搜索引擎） |
| 进度追踪 | 计算"你认识这篇文章中 X% 的词汇" |
| SEO | 生成结构化数据（词汇表 FAQ Schema） |
| 阶段 2 同步 | 作为词汇的权威数据源，上传到 D1 |

---

## 4. 阶段 1C：SEO + 新用户引导 + 数据分析

### 4.1 SEO 优化清单

> **工作量**：1 天
> **成本**：$0

#### 4.1.1 Hexo 配置修改

```yaml
# _config.yml 追加/修改

# 确保生成 sitemap
plugins:
  - hexo-generator-sitemap

sitemap:
  path: sitemap.xml
  rel: true

# 确保生成 feed
feed:
  type: atom
  path: atom.xml
  limit: 20
```

安装插件：

```bash
npm install hexo-generator-sitemap hexo-generator-feed --save
```

#### 4.1.2 结构化数据（JSON-LD）

在 `_config.fluid.yml` 的 `custom_head` 中添加：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ChronoSina 历知",
  "url": "https://gouhongshen-gmail.github.io/article.github.io/",
  "description": "Learn Chinese language and culture through history articles",
  "inLanguage": ["en", "zh-CN"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gouhongshen-gmail.github.io/article.github.io/search/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

#### 4.1.3 为每篇文章生成 Article Schema

创建 Hexo 辅助脚本自动注入 JSON-LD：

```javascript
// scripts/helpers/article-schema.js
hexo.extend.helper.register('articleSchema', function (post) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "datePublished": post.date.toISOString(),
    "dateModified": (post.updated || post.date).toISOString(),
    "author": { "@type": "Person", "name": "ChronoSina" },
    "publisher": {
      "@type": "Organization",
      "name": "ChronoSina",
      "logo": { "@type": "ImageObject", "url": "/images/icon-512.png" }
    },
    "description": post.description || post.excerpt || "",
    "mainEntityOfPage": post.permalink,
    "inLanguage": "en",
    "about": {
      "@type": "Thing",
      "name": "Chinese History",
      "sameAs": "https://en.wikipedia.org/wiki/History_of_China"
    }
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
});
```

在 Fluid 主题的文章模板覆盖中注入（或通过 `custom_head_per_page` 配置）。如果 Fluid 不直接支持 per-page injection，可以在 `scripts/tags/` 或 injector 中做：

```javascript
// scripts/injector/seo-injector.js
hexo.extend.injector.register('head_end', (data) => {
  if (data.is_post && data.is_post()) {
    return `<!-- Article Schema injected by seo-injector -->`;
  }
  return '';
}, 'post');
```

#### 4.1.4 Open Graph 和 Twitter Card

Fluid 主题已内置 OG 标签支持。确认以下配置已启用：

```yaml
# _config.fluid.yml
meta:
  author:
    enable: true
    name: "ChronoSina"
```

在每篇文章的 front matter 中添加：

```yaml
---
title: "The Grand Canal: How China Connected North and South"
description: "Explore the 2,500-year history of China's Grand Canal and learn key Chinese vocabulary about waterways and infrastructure."
keywords:
  - chinese history
  - grand canal
  - learn chinese
  - chinese vocabulary
cover: /images/grand-canal-cover.jpg
---
```

#### 4.1.5 SEO 长尾关键词策略（来自评审者 R6 Daniela 的建议）

```
目标关键词矩阵：

主关键词（高竞争）：
  - learn chinese through history
  - chinese history in english

长尾关键词（低竞争，高转化）：
  - chinese vocabulary for history students
  - mandate of heaven chinese characters
  - grand canal chinese vocabulary
  - sui dynasty chinese words
  - learn chinese characters from history
  - chinese history reading practice

每篇文章标题格式：
  "[Topic]: [Hook] + Learn Chinese Vocabulary"
  例：The Grand Canal: How China Connected North and South | Learn Chinese
```

### 4.2 新用户引导（Onboarding）

> **文件**：`source/js/onboarding.js` + `source/css/onboarding.css`
> **工作量**：2 天
> **成本**：$0

#### 4.2.1 触发条件

```javascript
// 首次访问检测
const isFirstVisit = !localStorage.getItem('chronosina_onboarded');
const isArticlePage = document.querySelector('[data-cn-lesson]') !== null;

if (isFirstVisit && isArticlePage) {
  startOnboarding();
}
```

#### 4.2.2 引导流程（3 步，不超过 60 秒）

```
步骤 1/3：欢迎
┌──────────────────────────────────────────────┐
│  🏛️  Welcome to ChronoSina                  │
│                                              │
│  You're reading Chinese history in English.  │
│  But this article also teaches you Chinese!  │
│                                              │
│  Try clicking on any highlighted Chinese     │
│  characters in the article below.            │
│                                              │
│           [ Show me how → ]                  │
└──────────────────────────────────────────────┘

步骤 2/3：交互演示
  - 自动滚动到文章中第一个 [data-cn-token]
  - 高亮它（加脉动动画）
  - 用户点击后，popover 弹出
  - 在 popover 旁边显示提示气泡：
    "🔊 Click to hear pronunciation
     💾 Click to save to your vocabulary"

步骤 3/3：中文水平快速测试（可选）
┌──────────────────────────────────────────────┐
│  📊 How much Chinese do you know?            │
│                                              │
│  ○ None at all — just curious                │
│  ○ A few words (你好, 谢谢)                   │
│  ○ HSK 1-2 level                             │
│  ○ HSK 3-4 level                             │
│  ○ HSK 5+ / fluent                           │
│                                              │
│    [ Skip ]          [ Continue ]            │
└──────────────────────────────────────────────┘
```

#### 4.2.3 存储引导结果

```javascript
// 引导完成后
localStorage.setItem('chronosina_onboarded', 'true');
localStorage.setItem('chronosina_level', selectedLevel); // 'none'|'beginner'|'hsk12'|'hsk34'|'hsk5plus'

// level 用于：
// 1. SRS 引擎初始难度设置
// 2. 决定是否显示拼音（HSK5+ 默认隐藏）
// 3. 文章推荐排序
```

#### 4.2.4 UI 实现要点

```css
/* source/css/onboarding.css 要点 */

.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-card {
  background: var(--board-bg, #fff);
  border-radius: 16px;
  padding: 2rem;
  max-width: 420px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  animation: onboard-in 0.3s ease-out;
}

/* 步骤 2：高亮目标元素 */
.onboarding-spotlight {
  position: relative;
  z-index: 10000;
  box-shadow: 0 0 0 4px var(--lesson-active, #3b82f6),
              0 0 0 9999px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

@keyframes onboard-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 4.3 数据分析

> **工作量**：30 分钟
> **成本**：$0

#### Cloudflare Web Analytics（隐私友好，无 cookie）

1. 登录 Cloudflare → Web Analytics → 添加站点
2. 获取 JS snippet
3. 加入 `_config.fluid.yml` 的 `custom_js` 或 `custom_html` (页脚):

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

#### 自定义事件追踪

在 SRS 引擎和引导流程中加入自定义事件（利用 `navigator.sendBeacon` 发送到自己的 Worker）：

```javascript
// source/js/analytics-events.js
function trackEvent(category, action, label) {
  // 阶段 1：仅写入 localStorage 日志
  const events = JSON.parse(localStorage.getItem('chronosina_events') || '[]');
  events.push({ category, action, label, ts: Date.now() });
  // 只保留最近 500 条
  if (events.length > 500) events.splice(0, events.length - 500);
  localStorage.setItem('chronosina_events', JSON.stringify(events));
}

// 使用示例
trackEvent('srs', 'review', 'quality-3');  // 复习了一个词，质量=3
trackEvent('onboarding', 'complete', 'hsk12'); // 引导完成
trackEvent('vocab', 'save', '运河');        // 保存了一个生词
```

阶段 2 可将事件上传到 D1 做分析。

---

## 5. 阶段 2A：用户认证 + 数据库

> **前置条件**：阶段 1 完成，有至少 5 篇文章，有真实用户反馈
> **成本**：~$0-5/月（Cloudflare Workers/D1 免费套餐）
> **工作量**：3-5 天

### 5.1 Cloudflare D1 数据库 Schema

> D1 是 Cloudflare 的边缘 SQLite 数据库
> 免费额度：5GB 存储、500 万行读/天、10 万行写/天（远超早期需求）

#### 建表 SQL

```sql
-- users 表
CREATE TABLE users (
  id TEXT PRIMARY KEY,            -- UUID v4
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,    -- 'google' | 'magic_link' | 'x' | 'github'
  provider_id TEXT,               -- OAuth provider 的用户 ID
  chinese_level TEXT DEFAULT 'none',  -- 引导时选择的水平
  tier TEXT DEFAULT 'free',       -- 'free' | 'pro'
  stripe_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- sessions 表
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,            -- 随机 token
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- vocabulary 表（云端 SRS 数据）
CREATE TABLE vocabulary (
  id TEXT PRIMARY KEY,            -- UUID v4
  user_id TEXT NOT NULL REFERENCES users(id),
  word_id TEXT NOT NULL,          -- 对应 vocabulary.json 中的 id
  text TEXT NOT NULL,             -- 中文
  pinyin TEXT,
  gloss TEXT,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TEXT,               -- ISO 日期
  last_review TEXT,
  quality_history TEXT,           -- JSON: [3,4,5,2,...]
  source_article TEXT,            -- 来源文章路径
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, word_id)
);
CREATE INDEX idx_vocab_user ON vocabulary(user_id);
CREATE INDEX idx_vocab_review ON vocabulary(user_id, next_review);

-- review_log 表（复习历史，用于分析和 FSRS 升级）
CREATE TABLE review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  word_id TEXT NOT NULL,
  quality INTEGER NOT NULL,       -- 0-5
  review_time_ms INTEGER,         -- 用户思考时间
  reviewed_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_review_user ON review_log(user_id);

-- user_progress 表（阅读进度）
CREATE TABLE user_progress (
  user_id TEXT NOT NULL REFERENCES users(id),
  article_path TEXT NOT NULL,
  words_known INTEGER DEFAULT 0,
  words_total INTEGER DEFAULT 0,
  last_read_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_path)
);
```

#### 为什么选 D1 而不是 Firebase / Supabase？

| 对比 | D1 | Firebase | Supabase |
|------|-----|----------|----------|
| 免费额度 | 5GB + 500万读/天 | Spark: 1GB | 500MB + 5万行 |
| 认证 | 自己写 | 内置（但贵） | 内置 |
| 锁定度 | 低（标准 SQL） | 高 | 中 |
| 边缘部署 | ✅ 全球 | ❌ 单区域 | ❌ 单区域 |
| 成本 @ 10万用户 | ~$5/月 | ~$5,400/月 | ~$25/月 |

### 5.2 认证系统

> **文件**：Cloudflare Worker 项目 `workers/auth/`
> **支持登录方式**：Google OAuth、Magic Link（邮箱验证码）、X (Twitter) OAuth 2.0

#### 5.2.1 项目结构

```
workers/
├── auth/
│   ├── wrangler.toml
│   ├── src/
│   │   ├── index.ts              # 路由入口
│   │   ├── routes/
│   │   │   ├── google.ts         # Google OAuth 回调
│   │   │   ├── magic-link.ts     # 邮箱验证码发送/验证
│   │   │   ├── x-oauth.ts        # X (Twitter) OAuth 2.0
│   │   │   ├── session.ts        # 会话管理
│   │   │   └── user.ts           # 用户信息 CRUD
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT 验证中间件
│   │   └── utils/
│   │       ├── jwt.ts            # JWT 签发/验证
│   │       ├── crypto.ts         # 密码学工具
│   │       └── email.ts          # 邮件发送 (Resend)
│   └── package.json
```

#### 5.2.2 Wrangler 配置

```toml
# workers/auth/wrangler.toml
name = "chronosina-auth"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "chronosina-db"
database_id = "xxx"  # wrangler d1 create 后获取

[vars]
FRONTEND_URL = "https://gouhongshen-gmail.github.io/article.github.io"
JWT_ISSUER = "chronosina"

# 敏感信息用 secrets（不写在配置文件中）
# wrangler secret put GOOGLE_CLIENT_SECRET
# wrangler secret put JWT_SECRET
# wrangler secret put RESEND_API_KEY
# wrangler secret put X_CLIENT_SECRET
```

#### 5.2.3 Google OAuth 流程

```
用户点击 "Sign in with Google"
     │
     ▼
前端重定向 → https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=xxx
  &redirect_uri=https://chronosina-auth.YOUR.workers.dev/auth/google/callback
  &response_type=code
  &scope=email profile
  &state=随机字符串
     │
     ▼
Google 回调 → Worker /auth/google/callback?code=xxx&state=xxx
     │
     ▼
Worker:
  1. 用 code 换 access_token (POST https://oauth2.googleapis.com/token)
  2. 用 token 获取用户信息 (GET https://www.googleapis.com/oauth2/v2/userinfo)
  3. 查找/创建 users 记录 (INSERT OR IGNORE)
  4. 生成 session token + JWT
  5. 设置 HttpOnly cookie 或返回 JWT
  6. 重定向回前端
```

#### 5.2.4 Magic Link 流程（无密码登录）

```
用户输入邮箱 → POST /auth/magic-link/send
     │
     ▼
Worker:
  1. 生成 6 位验证码 + 过期时间 (15 分钟)
  2. 存入 D1 临时表
  3. 通过 Resend API 发送邮件
     │
     ▼
用户输入验证码 → POST /auth/magic-link/verify
     │
     ▼
Worker:
  1. 验证 code + 未过期
  2. 查找/创建 users 记录
  3. 签发 JWT
  4. 返回给前端
```

#### 5.2.5 JWT Token 策略

```javascript
// workers/auth/src/utils/jwt.ts 核心逻辑

const JWT_EXPIRY = '7d';  // Access Token 7 天
const REFRESH_WINDOW = '1d'; // 到期前 1 天自动续期

// JWT Payload
interface JWTPayload {
  sub: string;     // user_id
  email: string;
  tier: 'free' | 'pro';
  iat: number;
  exp: number;
}

// 使用 Web Crypto API（Workers 原生支持，不需要 jsonwebtoken 库）
async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoder = new TextEncoder();
  
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  
  return `${headerB64}.${payloadB64}.${sigB64}`;
}
```

#### 5.2.6 前端登录 UI

```
登录模态框（嵌入在文章页的顶栏）

┌───────────────────────────────────────┐
│         Sign in to ChronoSina         │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │  🔵  Continue with Google       │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  ✖   Continue with X           │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ──── or use email ────               │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │  your@email.com                 │  │
│  └─────────────────────────────────┘  │
│         [ Send magic link ]           │
│                                       │
│  Free: Save vocab across devices      │
│  Pro: AI tutor + unlimited content    │
└───────────────────────────────────────┘
```

#### 5.2.7 API 路由总览

```
POST   /auth/google          → 重定向到 Google
GET    /auth/google/callback  → 处理回调
POST   /auth/x               → 重定向到 X
GET    /auth/x/callback       → 处理回调
POST   /auth/magic-link/send  → 发送验证码
POST   /auth/magic-link/verify→ 验证并登录
POST   /auth/logout           → 清除 session
GET    /auth/me               → 返回当前用户信息（需 JWT）

GET    /api/user/profile      → 用户资料
PUT    /api/user/profile      → 更新资料
PUT    /api/user/level        → 更新中文水平
```

---

## 6. 阶段 2B：进度同步 + 付费系统

### 6.1 本地 → 云端同步协议

> **核心原则**：Local-First（本地优先）
> - 离线时一切功能正常，数据存 IndexedDB
> - 上线后自动同步到 D1
> - 本地是 source of truth，冲突时本地数据覆盖云端

#### 6.1.1 同步流程

```
打开页面
  │
  ├─ 已登录？
  │    │
  │    ├─ 有网络？
  │    │    │
  │    │    └─ 执行同步：
  │    │         1. 读取本地 IndexedDB 所有记录
  │    │         2. 读取上次同步时间戳 (localStorage: last_sync_at)
  │    │         3. POST /api/sync/push
  │    │            Body: { vocabulary: [...], reviewLog: [...], since: last_sync_at }
  │    │         4. 服务端合并逻辑（见下）
  │    │         5. 响应返回服务端新增/更新的记录
  │    │         6. 合并到本地 IndexedDB
  │    │         7. 更新 last_sync_at
  │    │
  │    └─ 无网络？
  │         └─ 正常使用，下次上线时同步
  │
  └─ 未登录？
       └─ 一切存本地，引导用户登录以跨设备同步
```

#### 6.1.2 同步 API

```
POST  /api/sync/push     → 上传本地变更 + 拉取远端变更
GET   /api/sync/pull     → 仅拉取远端数据（新设备首次登录）
```

#### 6.1.3 合并策略（服务端 Worker 逻辑）

```javascript
// workers/sync/src/merge.ts 核心逻辑

async function mergeVocabulary(db, userId, clientWords) {
  for (const word of clientWords) {
    const serverWord = await db.prepare(
      'SELECT * FROM vocabulary WHERE user_id = ? AND word_id = ?'
    ).bind(userId, word.word_id).first();

    if (!serverWord) {
      // 服务端没有 → 直接插入
      await insertWord(db, userId, word);
    } else {
      // 都有 → 取 updated_at 更新的那个
      const clientTime = new Date(word.updated_at).getTime();
      const serverTime = new Date(serverWord.updated_at).getTime();
      if (clientTime > serverTime) {
        await updateWord(db, userId, word);
      }
      // 如果服务端更新 → 不覆盖，返回给客户端
    }
  }

  // review_log 只 append，不需要合并
  // 直接 INSERT，有重复则忽略（用 reviewed_at + word_id 判断）
}
```

#### 6.1.4 前端同步模块

```javascript
// source/js/sync.js

const SyncManager = {
  async pushChanges() {
    const jwt = localStorage.getItem('chronosina_jwt');
    if (!jwt) return;

    const lastSync = localStorage.getItem('chronosina_last_sync') || '1970-01-01';
    
    // 从 IndexedDB 读取自 lastSync 以来的变更
    const db = await SRSEngine.getDB();
    const tx = db.transaction(['vocabulary', 'reviewLog'], 'readonly');
    
    const allWords = await tx.objectStore('vocabulary').getAll();
    const changedWords = allWords.filter(w =>
      new Date(w.updatedAt) > new Date(lastSync)
    );
    
    const allReviews = await tx.objectStore('reviewLog').getAll();
    const newReviews = allReviews.filter(r =>
      new Date(r.reviewedAt) > new Date(lastSync)
    );

    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        vocabulary: changedWords,
        reviewLog: newReviews,
        since: lastSync,
      }),
    });

    if (response.ok) {
      const { serverUpdates } = await response.json();
      // 把服务端更新的记录写入本地 IndexedDB
      await this.applyServerUpdates(serverUpdates);
      localStorage.setItem('chronosina_last_sync', new Date().toISOString());
    }
  },

  // 页面加载时自动同步
  init() {
    if (navigator.onLine) {
      this.pushChanges().catch(console.error);
    }
    window.addEventListener('online', () => this.pushChanges());
  }
};
```

### 6.2 Stripe 付费系统

> **成本**：Stripe 手续费 2.9% + $0.30/笔
> **工作量**：2-3 天

#### 6.2.1 订阅方案

```
┌─────────────────────────────────────────────────────────────┐
│                    ChronoSina Pricing                       │
│                                                             │
│  ┌──────────────┐        ┌──────────────────┐              │
│  │    FREE      │        │      PRO         │              │
│  │              │        │   $12/月          │              │
│  │  ✓ 3篇文章   │        │   或 $99/年      │              │
│  │  ✓ 基础SRS   │        │                  │              │
│  │  ✓ 离线学习  │        │  ✓ 全部文章      │              │
│  │  ✗ AI问答    │        │  ✓ AI 中文问答   │              │
│  │  ✗ 云同步    │        │  ✓ 跨设备同步    │              │
│  │              │        │  ✓ 高级统计      │              │
│  │ [Start Free] │        │  ✓ 社区访问      │              │
│  └──────────────┘        │                  │              │
│                          │ [Subscribe →]    │              │
│                          └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Stripe 集成（Worker 端）

```javascript
// workers/payment/src/index.ts

import Stripe from 'stripe';

// 创建 Checkout Session
async function createCheckout(request, env) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const { userId, plan } = await request.json(); // plan: 'monthly' | 'yearly'

  const priceId = plan === 'monthly'
    ? env.STRIPE_PRICE_MONTHLY   // $12/月
    : env.STRIPE_PRICE_YEARLY;   // $99/年

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: userEmail, // 从 JWT 获取
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/pricing`,
    metadata: { userId },
  });

  return new Response(JSON.stringify({ url: session.url }));
}

// Webhook 处理订阅事件
async function handleWebhook(request, env) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      // 升级用户为 Pro
      await env.DB.prepare(
        'UPDATE users SET tier = ?, stripe_customer_id = ? WHERE id = ?'
      ).bind('pro', session.customer, userId).run();
      break;
    }

    case 'customer.subscription.deleted': {
      // 降级用户回 Free
      const customerId = event.data.object.customer;
      await env.DB.prepare(
        'UPDATE users SET tier = ? WHERE stripe_customer_id = ?'
      ).bind('free', customerId).run();
      break;
    }

    case 'invoice.payment_failed': {
      // 发邮件提醒用户更新支付方式
      break;
    }
  }

  return new Response('ok');
}
```

#### 6.2.3 前端 Paywall 逻辑

```javascript
// source/js/paywall.js

const Paywall = {
  FREE_ARTICLE_LIMIT: 3,

  async checkAccess(articlePath) {
    const jwt = localStorage.getItem('chronosina_jwt');
    
    if (!jwt) {
      // 未登录：用 localStorage 记录已读文章数
      const read = JSON.parse(localStorage.getItem('articles_read') || '[]');
      if (!read.includes(articlePath)) {
        read.push(articlePath);
        localStorage.setItem('articles_read', JSON.stringify(read));
      }
      if (read.length > this.FREE_ARTICLE_LIMIT) {
        this.showPaywall('free_limit');
        return false;
      }
      return true;
    }

    // 已登录：解析 JWT 检查 tier
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    if (payload.tier === 'pro') return true;

    // Free tier 用户：检查免费额度
    const readCount = await this.getReadCount(jwt);
    if (readCount > this.FREE_ARTICLE_LIMIT) {
      this.showPaywall('upgrade');
      return false;
    }
    return true;
  },

  showPaywall(type) {
    // 显示订阅提示 overlay
    // type = 'free_limit' → "Sign up to read more"
    // type = 'upgrade' → "Upgrade to Pro for unlimited access"
  }
};
```

#### 6.2.4 Stripe 配置步骤

```bash
# 1. 注册 Stripe 账户（test mode 先用）
# 2. 创建 Product
#    Name: ChronoSina Pro
#    月付 Price: $12/月 (recurring)
#    年付 Price: $99/年 (recurring)
# 3. 获取 Price ID（以 price_ 开头）
# 4. 设置 Webhook endpoint
#    URL: https://chronosina-payment.YOUR.workers.dev/webhook
#    Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
# 5. 保存密钥到 Worker secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_MONTHLY
wrangler secret put STRIPE_PRICE_YEARLY
```

### 6.3 R2 对象存储（音频文件）

> **用途**：存储自定义发音音频（阶段 1 用 Web Speech API 合成语音，阶段 2 可选加入真人录音）
> **免费额度**：10GB 存储 + 1000 万次读/月

```
存储结构：
r2-bucket: chronosina-audio/
├── words/
│   ├── yunhe.mp3           # 运河
│   ├── tianming.mp3        # 天命
│   └── ...
└── sentences/
    ├── grand-canal-s001.mp3
    └── ...

访问方式：
绑定自定义域名到 R2：audio.chronosina.com
或用 Workers 做代理（免费）
```

---

## 7. 阶段 3：AI 中文问答 + 社区

> **前置条件**：阶段 2 完成，有付费用户
> **成本**：$20-50/月（主要是 LLM API）
> **工作量**：1-2 周

### 7.1 AI 中文问答 (Pro 功能)

> **目的**：用户在阅读文章时，可以就文章内容、中文语法、历史背景提问
> **模型选择**：Google Gemini 2.0 Flash（免费额度高，中文能力好）或 DeepSeek V3（便宜）

#### 7.1.1 API 设计

```
POST /api/ai/ask
Headers: Authorization: Bearer <jwt>
Body: {
  "question": "Why is 天命 (tiānmìng) used here instead of 命运?",
  "articlePath": "/2025/03/15/mandate-of-heaven/",
  "context": {
    "sentence": "The concept of 天命 was central to political legitimacy.",
    "wordFocus": "天命"
  }
}

Response: {
  "answer": "Great question! 天命 specifically refers to...",
  "relatedWords": ["命运", "天子", "正统"],
  "grammarNote": "天命 is a literary/classical compound..."
}
```

#### 7.1.2 Prompt 模板

```javascript
// workers/ai/src/prompts.ts

function buildPrompt(question, context, userLevel) {
  return `You are a Chinese language tutor helping a student who is reading 
an English article about Chinese history. The student's level is ${userLevel}.

ARTICLE CONTEXT:
The student is reading about: ${context.articlePath}
Relevant sentence: "${context.sentence}"
${context.wordFocus ? `They're asking about the word: ${context.wordFocus}` : ''}

RULES:
1. Answer in English, but include Chinese characters with pinyin when relevant
2. Keep answers concise (under 200 words)
3. If the question is about grammar, explain the pattern with examples
4. If about history, connect the Chinese term to its historical usage
5. If about vocabulary, compare similar words and note usage differences
6. Always be encouraging and culturally sensitive
7. Adapt complexity to the student's level: ${userLevel}

STUDENT'S QUESTION:
${question}`;
}
```

#### 7.1.3 速率限制

```javascript
// Pro 用户: 50 次/天
// Free 用户: 0 次（仅 Pro 功能）

const DAILY_LIMIT = 50;

async function checkRateLimit(db, userId) {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM ai_queries 
     WHERE user_id = ? AND date(asked_at) = ?`
  ).bind(userId, today).first();
  
  return result.count < DAILY_LIMIT;
}
```

#### 7.1.4 成本控制

```
Gemini 2.0 Flash 价格（2025 年）：
  Input:  $0.10 / 1M tokens
  Output: $0.40 / 1M tokens

每次问答约消耗：
  Input:  ~500 tokens (prompt + context)
  Output: ~300 tokens (回答)
  成本:   ~$0.00017 / 次

50 次/天/用户，100 个活跃 Pro 用户：
  5000 次/天 × $0.00017 = $0.85/天 ≈ $25/月

DeepSeek V3 更便宜（约 1/5 价格），可作为备选。

策略：
  - 默认用 Gemini Flash（质量好）
  - 高峰期降级到 DeepSeek（成本低）
  - 缓存常见问题的回答（D1 中存 question hash → answer）
```

#### 7.1.5 前端 AI 对话 UI

```
文章页面右下角浮动按钮 → 点击展开对话面板

┌─────────────────────────────────────┐
│  🤖 Ask about this article          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ You: Why is 运河 used       │    │
│  │ instead of 河?              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🤖: Great question! 运河   │    │
│  │ (yùnhé) specifically means │    │
│  │ "canal" - a man-made       │    │
│  │ waterway...                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Ask a question...        ⏎ │    │
│  └─────────────────────────────┘    │
│  38/50 questions today              │
└─────────────────────────────────────┘
```

### 7.2 社区（Discourse on Oracle Cloud）

> **选择 Discourse 原因**（来自评审者 R10 Preet 的建议）：
> - 开源、功能完善的论坛
> - 学习者需要讨论的地方不是 GitHub Issues
> - 支持 SSO（与主站统一登录）
> - 支持多语言和国际化

#### 7.2.1 Oracle Cloud 免费 ARM 实例

```
免费资源（Always Free Tier）：
  - 4 OCPU + 24 GB RAM（ARM Ampere A1 实例）
  - 200 GB 块存储
  - 位置：选择离目标用户最近的区域（推荐 US West / Tokyo）

安装步骤：
  1. 注册 Oracle Cloud（需信用卡验证，不收费）
  2. 创建 ARM 实例（Ubuntu 22.04）
  3. 开放端口 80, 443, 22
  4. SSH 登录后安装 Discourse
```

#### 7.2.2 Discourse 安装

```bash
# SSH 到 Oracle 实例后

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Discourse
sudo mkdir /var/discourse
git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse

# 配置
sudo ./discourse-setup

# 需要的信息：
# - 域名：community.chronosina.com
# - 管理员邮箱
# - SMTP 配置（用 Resend 或 Mailgun 免费额度）
# - Let's Encrypt 自动 SSL
```

#### 7.2.3 SSO 集成

Discourse 支持 DiscourseConnect SSO：

```javascript
// workers/auth/src/routes/discourse-sso.ts

async function handleDiscourseSSORequest(request, env) {
  // 1. Discourse 重定向用户到我们的登录页
  //    带 sso= (base64 payload) 和 sig= (HMAC)
  const url = new URL(request.url);
  const sso = url.searchParams.get('sso');
  const sig = url.searchParams.get('sig');

  // 2. 验证 HMAC
  const valid = await verifyHMAC(sso, sig, env.DISCOURSE_SSO_SECRET);
  if (!valid) return new Response('Invalid signature', { status: 403 });

  // 3. 检查用户是否已登录
  const user = await getCurrentUser(request, env);
  if (!user) {
    // 重定向到登录页，登录后回到这里
    return Response.redirect(`${env.FRONTEND_URL}/login?return=discourse`);
  }

  // 4. 构造返回 payload
  const nonce = decodePayload(sso).nonce;
  const returnPayload = {
    nonce,
    email: user.email,
    external_id: user.id,
    username: user.display_name,
    name: user.display_name,
    avatar_url: user.avatar_url,
  };

  // 5. 签名并重定向回 Discourse
  const returnSSO = encodePayload(returnPayload);
  const returnSig = await signHMAC(returnSSO, env.DISCOURSE_SSO_SECRET);

  return Response.redirect(
    `https://community.chronosina.com/session/sso_login?sso=${returnSSO}&sig=${returnSig}`
  );
}
```

#### 7.2.4 Discourse 配置

```
在 Discourse 管理面板中设置：

Settings → Login:
  - enable_discourse_connect: true
  - discourse_connect_url: https://chronosina-auth.YOUR.workers.dev/auth/discourse-sso
  - discourse_connect_secret: <共享密钥>

Categories（社区分区）：
  📖 Article Discussions     — 每篇文章一个讨论帖（自动创建）
  🈶 Chinese Learning Q&A   — 学中文的问题
  📜 History Deep Dives      — 历史深度讨论
  🎉 Progress & Motivation  — 打卡和成就分享
  💡 Feature Requests        — 功能建议

Plugins:
  - discourse-solved （标记最佳答案）
  - discourse-voting （功能投票）
```

---

## 8. CI/CD + 部署 + 成本总览

### 8.1 部署架构演进

```
阶段 1（当前 → 阶段 1 完成）：
  GitHub Pages 继续使用，不迁移
  
  main push → GitHub Actions → hexo generate → gh-pages branch → GitHub Pages
  域名：gouhongshen-gmail.github.io/article.github.io
  成本：$0

阶段 2（有付费需求后迁移）：
  迁移到 Cloudflare Pages（支持自定义域名 + Workers 集成）
  
  main push → GitHub Actions → hexo generate → Wrangler deploy → Cloudflare Pages
  域名：chronosina.com (购买域名 ~$10/年)
  Workers 子域名：chronosina-auth.YOUR.workers.dev
  成本：~$10/年(域名) + $0(Cloudflare Pages)

阶段 3：
  同阶段 2 + Oracle ARM 上的 Discourse
  社区域名：community.chronosina.com
```

### 8.2 GitHub Actions 工作流

#### 阶段 1：更新现有 deploy.yml

```yaml
# .github/workflows/deploy.yml
name: Deploy Blog

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # 生成站点（包括 vocabulary.json）
      - run: npx hexo generate

      # 验证生成的文件
      - name: Verify build artifacts
        run: |
          test -f public/api/vocabulary.json && echo "✅ vocabulary.json" || echo "❌ Missing"
          test -f public/manifest.json && echo "✅ manifest.json" || echo "❌ Missing"
          test -f public/service-worker.js && echo "✅ service-worker.js" || echo "❌ Missing"

      # 部署到 GitHub Pages
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

#### 阶段 2：增加 Workers 部署

```yaml
# .github/workflows/deploy.yml 阶段 2 版本
name: Deploy Blog + Workers

on:
  push:
    branches: [main]

jobs:
  build-deploy-site:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx hexo generate

      # 部署到 Cloudflare Pages
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy public --project-name=chronosina

  deploy-workers:
    runs-on: ubuntu-latest
    needs: build-deploy-site  # 站点先部署
    strategy:
      matrix:
        worker: [auth, sync, payment, ai]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Worker dependencies
        run: cd workers/${{ matrix.worker }} && npm ci
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: workers/${{ matrix.worker }}
          command: deploy
```

### 8.3 环境变量和 Secrets 管理

```
GitHub Secrets（Settings → Secrets and variables → Actions）：
  CLOUDFLARE_API_TOKEN      # Cloudflare API Token（edit Workers/Pages/D1/R2）
  
Cloudflare Worker Secrets（用 wrangler secret put）：
  GOOGLE_CLIENT_ID           # Google OAuth
  GOOGLE_CLIENT_SECRET
  X_CLIENT_ID                # X OAuth
  X_CLIENT_SECRET
  JWT_SECRET                 # JWT 签名密钥（随机 64 字符）
  RESEND_API_KEY             # 发邮件
  STRIPE_SECRET_KEY          # Stripe 支付
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_MONTHLY
  STRIPE_PRICE_YEARLY
  DISCOURSE_SSO_SECRET       # Discourse SSO
```

### 8.4 完整成本清单

| 阶段 | 项目 | 服务商 | 月成本 | 备注 |
|------|------|--------|--------|------|
| **1** | 静态托管 | GitHub Pages | $0 | 已有 |
| 1 | CDN | Cloudflare (免费) | $0 | 自带 |
| 1 | 域名 | — | $0 | 用 github.io 子域名 |
| 1 | 评论系统 | Cloudflare Workers | $0 | 已有 |
| 1 | 分析 | Cloudflare Analytics | $0 | 免费 |
| | **阶段 1 合计** | | **$0/月** | |
| **2** | 域名 | Cloudflare Registrar | ~$1/月 | ~$10-12/年 |
| 2 | 托管 | Cloudflare Pages | $0 | 免费 |
| 2 | 后端 | Cloudflare Workers | $0 | 10万次/天免费 |
| 2 | 数据库 | Cloudflare D1 | $0 | 5GB+500万读/天 |
| 2 | 存储 | Cloudflare R2 | $0 | 10GB 免费 |
| 2 | 邮件 | Resend | $0 | 100封/天免费 |
| 2 | 支付 | Stripe | 2.9%+$0.30 | 从收入扣 |
| | **阶段 2 合计** | | **~$1/月** | |
| **3** | LLM API | Google Gemini | $10-30 | 按用量 |
| 3 | 社区服务器 | Oracle Cloud ARM | $0 | Always Free |
| 3 | 社区邮件 | Mailgun | $0 | 5000封/月免费 |
| 3 | SSL | Let's Encrypt | $0 | 自动续期 |
| | **阶段 3 合计** | | **~$11-31/月** | |
| | **全部合计** | | **$12-32/月** | |

### 8.5 盈亏平衡点

```
固定成本：~$30/月（阶段 3 全部启用后）
Pro 订阅：$12/月

盈亏平衡 = $30 ÷ $12 = 3 个 Pro 用户

100 个 Pro 用户时：
  收入: $1,200/月
  成本: ~$50/月（LLM 用量增加）
  利润: ~$1,150/月
```

### 8.6 监控和告警

```
Cloudflare Dashboard（免费）：
  - Workers 调用量、错误率、延迟
  - Pages 部署状态
  - D1 查询量
  - R2 存储用量

GitHub Actions：
  - 部署成功/失败通知（默认已有）

Oracle Cloud：
  - 实例健康检查
  - 内存/CPU 告警（OCI 控制台免费）

推荐额外监控（免费）：
  - UptimeRobot：监控站点和 API 可用性
    https://uptimerobot.com（50 个 monitors 免费）
  - Sentry：前端 JS 错误追踪
    https://sentry.io（5K events/月免费）
```

### 8.7 本地开发环境

```bash
# 初始化项目
cd article
npm install

# 本地开发（Hexo）
npx hexo server --debug     # http://localhost:4000

# 阶段 2 本地开发（Workers）
cd workers/auth
npm install
npx wrangler dev             # http://localhost:8787

# D1 本地数据库
npx wrangler d1 execute chronosina-db --local --file=schema.sql

# 测试
npx wrangler dev --test-scheduled  # 测试定时任务
```

---

## 附录：实施检查清单

### 阶段 1 检查清单（目标：2-3 周完成）

- [ ] SRS 引擎 (`source/js/srs-engine.js`)
  - [ ] SM-2 算法实现
  - [ ] IndexedDB 存储
  - [ ] 复习界面 UI
  - [ ] 与 popover 集成（"保存到词汇表"按钮）
- [ ] PWA
  - [ ] Service Worker (`source/service-worker.js`)
  - [ ] Manifest (`source/manifest.json`)
  - [ ] 离线回退页面 (`source/offline.html`)
  - [ ] 注册代码（`_config.fluid.yml` custom_head）
- [ ] 词汇导出
  - [ ] 插件 (`scripts/plugins/vocabulary-manifest.js`)
  - [ ] 验证 `public/api/vocabulary.json` 正确生成
- [ ] SEO
  - [ ] 安装 sitemap + feed 插件
  - [ ] JSON-LD 结构化数据
  - [ ] 所有文章 front matter 补齐 description, keywords
- [ ] 新用户引导
  - [ ] `source/js/onboarding.js` 3 步引导
  - [ ] `source/css/onboarding.css` 样式
  - [ ] localStorage 存储引导状态
- [ ] 数据分析
  - [ ] Cloudflare Web Analytics 集成
  - [ ] 自定义事件追踪
- [ ] 更新 CI/CD
  - [ ] deploy.yml 增加构建验证步骤

### 阶段 2 检查清单（目标：3-4 周完成）

- [ ] Cloudflare 基础设施
  - [ ] 购买域名 chronosina.com
  - [ ] 创建 D1 数据库 + 执行建表 SQL
  - [ ] 创建 R2 存储桶
- [ ] 认证系统
  - [ ] Google OAuth 配置 + Worker 实现
  - [ ] Magic Link 流程
  - [ ] X (Twitter) OAuth
  - [ ] JWT 签发/验证
  - [ ] 前端登录 UI
- [ ] 数据同步
  - [ ] sync Worker 实现
  - [ ] 前端 SyncManager
  - [ ] 冲突合并逻辑
- [ ] 付费系统
  - [ ] Stripe 产品创建
  - [ ] Checkout Worker
  - [ ] Webhook 处理
  - [ ] 前端 Paywall
- [ ] 部署迁移
  - [ ] GitHub Pages → Cloudflare Pages
  - [ ] 更新 deploy.yml
  - [ ] DNS 配置

### 阶段 3 检查清单（目标：2-3 周完成）

- [ ] AI 问答
  - [ ] Gemini API 集成
  - [ ] Prompt 模板
  - [ ] 速率限制
  - [ ] 前端对话 UI
- [ ] 社区
  - [ ] Oracle Cloud 实例创建
  - [ ] Discourse 安装
  - [ ] SSO 集成
  - [ ] 社区分区设置
- [ ] 监控
  - [ ] UptimeRobot 配置
  - [ ] Sentry 前端错误追踪

---

> **文档结束**
> 
> 本文档覆盖了从零成本起步到完整学习平台的所有技术实现细节。
> 按阶段渐进实施，每个阶段都能独立运行并交付价值。
> 
> 预计总开发时间：7-10 周（一人全职）或 3-4 个月（业余时间）
> 预计最终月成本：$12-32（不含 Stripe 手续费）
> 盈亏平衡：3 个 Pro 订阅用户
