# VimIn

macOS 全局悬浮 Vim 编辑器。按下快捷键，用 Vim 键位输入，复制到剪贴板，收起窗口。随时随地使用。

## 功能

- **全局快捷键**（默认 `⌥ Space`）在任意应用上方召唤悬浮编辑器
- **完整 Vim 模式**，基于 CodeMirror 6 + @replit/codemirror-vim
- **`:w`** 复制内容到剪贴板，**`:q`** 清空并隐藏，**`:wq`** 复制并隐藏
- **语法高亮**，支持 Markdown、JavaScript/TypeScript、Python、JSON，自动检测语言
- **`:set ft=<lang>`** 手动切换语言
- **剪贴板历史** — 通过 **`:history`** 浏览和复用过往内容
- **深色 / 浅色主题**，跟随系统偏好，可在标题栏切换
- **自定义快捷键** — 在设置中重新绑定全局快捷键
- **置顶透明窗口**，失焦自动隐藏
- **系统托盘**快速访问

## 安装

从 [Releases](https://github.com/debugtheworldbot/vimIn/releases) 下载最新 `.dmg`。

## 从源码构建

需要：Node.js、pnpm、Rust 工具链。

```bash
pnpm install
pnpm run tauri build
```

## 开发

```bash
pnpm run tauri dev
```

## 技术栈

Tauri 2 (Rust) + React 19 + TypeScript + CodeMirror 6

## 许可证

MIT
