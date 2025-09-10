# AI ThreadStash 浏览器插件目录结构设计

本插件用于导出ChatGPT会话记录，后续可扩展支持其他平台。

## 目录结构建议

```
browser-extension/
├── manifest.json           # 插件配置文件
├── content_scripts/        # 各平台页面内容脚本（如 chatgpt.js）
├── popup/                  # 插件弹窗页面（popup.html, popup.js, popup.css）
├── background/             # 后台脚本（background.js）
├── i18n/                   # 国际化资源（如 zh_CN/messages.json, en/messages.json）
├── styles/                 # 公共样式文件
├── assets/                 # 图标等静态资源
└── README.md               # 插件说明文档
```

## 各模块说明
- **manifest.json**：Chrome扩展主配置，声明权限、入口、脚本等。
- **content_scripts/**：针对ChatGPT等页面注入的脚本，实现会话解析与导出。
- **popup/**：用户交互界面，支持导出、设置等操作。
- **background/**：负责与内容脚本、popup通信，处理长生命周期任务。
- **i18n/**：多语言支持，便于国际化。
- **styles/**：统一样式，保证UI一致性。
- **assets/**：存放图标、图片等静态资源。

## 开发建议
- 采用模块化开发，便于后续扩展支持更多AI平台。
- 目录结构清晰，便于维护和协作。
- 优先实现ChatGPT内容脚本和基础导出功能。