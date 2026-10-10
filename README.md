# wmpt

高保真原型项目：后台管理端 + 前端移动端 H5。  
关注前端交互与视觉效果，数据使用本地 Mock，无需数据库。

## 目录结构

```
wmpt/
├── packages/
│   ├── admin/    # 后台管理端（默认端口 5174）
│   └── mobile/   # 移动端 H5（默认端口 5173）
├── scripts/
│   └── dev.mjs   # 一键启动并打印局域网地址
└── package.json
```

## 首次安装

在项目根目录执行：

```bash
npm install
```

## 一键启动

```bash
npm run dev
```

启动后终端会同时打印：

- 本机访问地址（localhost）
- **局域网访问地址**（发给同一 Wi-Fi 下的研发同事）

单独启动：

```bash
npm run dev:mobile   # 仅移动端
npm run dev:admin    # 仅后台
```

## 说明

- 当前为框架骨架，功能页面待你提供功能清单后继续补充。
- 端口被占用时 Vite 会自动切换到下一个可用端口，以终端实际输出为准。
