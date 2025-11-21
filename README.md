```markdown
# Protein Viewer

一个基于 Vue.js 和 Three.js 的交互式蛋白质结构可视化工具。

## 功能特性

*   **多种渲染模式**：支持点云、线框、球棍、卡通（二级结构）和表面模式，以不同方式展示蛋白质结构。
*   **真实数据**：直接从 RCSB PDB 数据库获取真实的蛋白质结构数据（PDB格式）。
*   **交互式操作**：支持鼠标拖拽旋转、滚轮缩放，方便从不同角度观察蛋白质。
*   **功能位点高亮**：非标准氨基酸或配体（HETATM）以白色亮点形式突出显示，可能代表重要的功能位点。
*   **用户界面**：提供直观的下拉菜单，用于选择不同的蛋白质和渲染模式。

## 技术栈

*   **前端框架**: [Vue.js 3](https://vuejs.org/)
*   **3D 渲染**: [Three.js](https://threejs.org/)
*   **构建工具**: [Vite](https://vitejs.dev/)
*   **UI 样式**: [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
*   **PDB 解析**: 自定义 JavaScript 解析器
*   **桌面应用打包**: [Electron](https://www.electronjs.org/)

## 项目结构

```
your-project-name/
├── public/
│   └── ...
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ProteinViewer.vue  # 核心 3D 渲染组件
│   ├── utils/
│   │   └── pdbParser.js       # PDB 文件解析工具
│   ├── views/
│   │   └── ProteinView.vue    # 主视图，包含选择器和渲染器
│   ├── App.vue
│   └── main.js
├── electron/                  # Electron 相关文件
│   ├── main.js
│   └── preload.js
├── package.json
├── vite.config.js
└── README.md
```

## 安装与运行

### 开发环境

1.  **克隆项目** (如果适用):
    ```bash
    git clone <your-repo-url>
    cd <your-project-name>
    ```

2.  **安装依赖**:
    ```bash
    npm install
    # 或者
    yarn install
    ```

3.  **启动开发服务器**:
    ```bash
    npm run dev
    # 或者
    yarn dev
    ```
    应用将在 `http://localhost:5173` 启动。

### 打包为桌面应用

1.  **构建 Vue 项目**:
    ```bash
    npm run build
    # 或者
    yarn build
    ```

2.  **打包 Electron 应用** (生成可执行文件):
    ```bash
    npm run electron:dist
    # 或者
    yarn electron:dist
    ```
    打包后的文件将位于 `release/` 目录下。

## 使用说明

1.  在页面上方的下拉菜单中选择一个蛋白质（例如 "肌红蛋白 (1MBO)"）。
2.  在 "渲染模式" 下拉菜单中选择您想要的可视化方式。
3.  使用鼠标左键拖拽旋转蛋白质，使用滚轮缩放。
4.  观察蛋白质的结构特征，白色亮点代表可能的功能位点。

## 代码规范

*   遵循 Vue 3 的 Composition API 风格。
*   JavaScript 代码遵循 ESLint 或 Prettier 的基本规范（如适用）。
*   CSS 样式使用 `<style scoped>` 以保持组件独立性。
*   PDB 解析逻辑独立封装在 `utils/pdbParser.js` 中。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进此项目。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)
```