# RentWise

RentWise 是一个面向租房决策的地图应用：输入地址或点击地图，即可获得该位置在 **安全性（Safety）**、**便利性（Accessibility）**、**生活方式（Convenience & Lifestyle）** 三个维度的 AI 评分与简述，帮助租客快速了解区域情况。

> 当前项目为前端 + Cloudflare Pages Functions 的轻量实现，适合做 Demo、课程项目或 MVP 验证。

## 功能亮点

- 🗺️ **地图交互**：支持地址搜索与地图点击选点。
- 🤖 **AI 分析**：通过 OpenAI API 返回三个维度的结构化 JSON 评分（1-5）。
- 🌐 **多语言界面**：支持英文、简体中文、西班牙语。
- ⭐ **可视化评分**：将分数渲染为星级，便于快速比较。

## 技术栈

- 前端：HTML / CSS / Vanilla JavaScript
- 地图服务：Google Maps JavaScript API（含 Places）
- 后端（Serverless）：Cloudflare Pages Functions
- AI：OpenAI Chat Completions API

## 项目结构

```text
RentWise/
├── index.html                 # 页面结构与 Google Maps SDK 引入
├── style.css                  # 样式
├── script.js                  # 地图交互、多语言切换、调用分析接口
├── functions/
│   └── api/
│       └── analyze.js         # Cloudflare Function：调用 OpenAI 并返回 JSON
└── README.md
```

## 快速开始

### 1) 克隆项目

```bash
git clone <your-repo-url>
cd RentWise
```

### 2) 配置 Google Maps API Key

当前 `index.html` 通过 `<script src="https://maps.googleapis.com/maps/api/js?...">` 引入地图 SDK。
请将其中的 `key` 替换为你自己的 Google Maps API Key，并确保已启用：

- Maps JavaScript API
- Places API

### 3) 配置 OpenAI Key（Cloudflare Secret）

`functions/api/analyze.js` 从 `env.OPENAI_API_KEY` 读取密钥。
在 Cloudflare Pages 项目中添加环境变量（Secret）：

- Key: `OPENAI_API_KEY`
- Value: 你的 OpenAI API Key

如果你本地使用 Wrangler 调试，可通过 Wrangler Secret 命令写入。

### 4) 本地运行（推荐 Wrangler）

如果你准备完整联调（含 `functions/`）：

```bash
npm install -g wrangler
wrangler pages dev .
```

然后访问命令行输出的本地地址（通常是 `http://127.0.0.1:8788`）。

> 仅打开静态页面也可以看到地图与 UI，但没有 Functions 环境时，`/api/analyze` 不会返回真实 AI 结果。

## API 说明

### `POST /api/analyze`

请求体示例：

```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA",
  "language": "en"
}
```

返回体（示例）：

```json
{
  "safety": {
    "rating": 4,
    "description": "Generally safe area with moderate evening foot traffic."
  },
  "accessibility": {
    "rating": 5,
    "description": "Excellent transit options and road connectivity."
  },
  "convenience": {
    "rating": 4,
    "description": "Strong mix of groceries, cafes, and daily amenities nearby."
  }
}
```

## 部署建议（Cloudflare Pages）

1. 将仓库连接到 Cloudflare Pages。
2. Build command 可留空（纯静态 + Functions）。
3. Output directory 设为仓库根目录（`.`）或按你的构建流程设置。
4. 在 Pages 项目中配置 `OPENAI_API_KEY` Secret。
5. 触发部署并验证 `/api/analyze` 返回。

## 常见问题

### 1) 为什么地图不显示？

- API Key 无效或配额不足。
- 未启用 Maps JavaScript API / Places API。
- Key 的 HTTP Referrer 限制与当前域名不匹配。

### 2) 为什么分析接口返回报错？

- `OPENAI_API_KEY` 未配置或错误。
- OpenAI 请求额度不足。
- 模型偶发返回非 JSON 文本（项目中已做基础容错）。

### 3) 为什么是演示文本而不是实时结果？

通常是 `/api/analyze` 不可用、请求失败，或后端环境变量缺失。

## 路线图（可选）

- [ ] 增加历史查询记录与收藏地点
- [ ] 增加通勤时间（到公司/学校）维度
- [ ] 增加租金区间与性价比评分
- [ ] 引入更严格的 JSON schema 校验
- [ ] 将前端明文地图 Key 改为环境注入方案

## License

可按你的需求补充（例如 MIT）。
