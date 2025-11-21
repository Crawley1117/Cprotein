// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // 推荐关闭，除非你确实需要
      contextIsolation: true, // 推荐开启
      // 如果你的 Vue 应用需要访问 Node.js API，可能需要调整
      preload: path.join(__dirname, 'preload.js') // 可选，用于安全地暴露 API
    },
    icon: path.join(__dirname, '../public/icon.png') // 可选，设置应用图标
  });

  // 在生产环境加载构建好的文件
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // 在开发环境连接到 Vite 开发服务器
    win.loadURL('http://localhost:5173'); // 默认 Vite 端口
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});