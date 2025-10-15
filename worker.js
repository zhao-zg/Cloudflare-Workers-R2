// ================================================================
// R2 文件管理系统 - 简化版 v3.1
// 作者：为 zhaozhenggang 定制
// 日期：2025-01-15
// 优化内容：
// 1. 未登录可查看和下载，登录后有完整管理权限
// 2. 修复批量下载bug
// 3. 支持自动重试（最多5次）
// 4. 使用后端 API 代理上传，避免跨域问题
// 5. 去除分片上传，保持简单
// ================================================================

export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
  
      if (path === '/favicon.ico') {
        return new Response('', { status: 204 });
      }
  
      if (path === '/') {
        return serveHTML(env);
      } else if (path === '/style.css') {
        return serveCSS();
      } else if (path === '/script.js') {
        return serveJS(env);
      }
  
      if (path.startsWith('/api/')) {
        return handleAPI(request, env, url);
      }
  
      return new Response('Not Found', { status: 404 });
    }
  };
  
  // ================================================================
  // HTML
  // ================================================================
  function serveHTML(env) {
    const html = `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>R2 文件管理系统</title>
      <link rel="stylesheet" href="/style.css">
  </head>
  <body>
      <div id="app">
          <div id="main-page" class="page">
              <header class="header">
                  <h1>🚀 R2 文件管理系统</h1>
                  <div>
                      <span class="badge" id="user-badge">游客模式</span>
                      <button id="login-btn" class="btn btn-primary">登录</button>
                      <button id="logout-btn" class="btn btn-secondary hidden">退出</button>
                  </div>
              </header>
  
              <div class="toolbar" id="admin-toolbar">
                  <button id="create-folder-btn" class="btn btn-primary">📁 新建文件夹</button>
                  <button id="upload-btn" class="btn btn-primary">⚡ 上传文件</button>
                  <input type="file" id="file-input" multiple style="display: none;">
                  <button id="move-selected-btn" class="btn btn-info">📦 移动</button>
                  <button id="delete-selected-btn" class="btn btn-danger">🗑️ 删除</button>
                  <button id="download-selected-btn" class="btn btn-success">⬇️ 下载</button>
              </div>
  
              <div class="breadcrumb" id="breadcrumb">
                  <span class="breadcrumb-item" data-path="">📂 根目录</span>
              </div>
  
              <div class="file-list-container">
                  <table class="file-table">
                      <thead>
                          <tr>
                              <th width="40" id="checkbox-header"><input type="checkbox" id="select-all"></th>
                              <th>名称</th>
                              <th width="120">大小</th>
                              <th width="180">修改时间</th>
                              <th width="360" id="actions-header">操作</th>
                          </tr>
                      </thead>
                      <tbody id="file-list"></tbody>
                  </table>
              </div>
  
              <div id="modal" class="modal hidden">
                  <div class="modal-content">
                      <h3 id="modal-title">标题</h3>
                      <div id="modal-body"></div>
                      <div class="modal-actions">
                          <button id="modal-cancel" class="btn btn-secondary">取消</button>
                          <button id="modal-confirm" class="btn btn-primary">确认</button>
                      </div>
                  </div>
              </div>
  
              <div id="toast" class="toast hidden"></div>
          </div>
      </div>
      
      <script src="/script.js"></script>
  </body>
  </html>`;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // ================================================================
  // CSS
  // ================================================================
  function serveCSS() {
    const css = `* { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
  .page { min-height: 100vh; }
  .hidden { display: none !important; }
  #main-page { background: #f5f7fa; }
  .header { background: white; padding: 20px 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
  .header h1 { color: #667eea; font-size: 24px; }
  .badge { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 10px; }
  .badge.guest { background: linear-gradient(135deg, #ffa500, #ff8c00); }
  .badge.admin { background: linear-gradient(135deg, #28a745, #20c997); }
  .toolbar { background: white; padding: 20px 30px; margin: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; gap: 12px; flex-wrap: wrap; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #667eea; color: white; }
  .btn-primary:hover:not(:disabled) { background: #5568d3; transform: translateY(-1px); }
  .btn-secondary { background: #6c757d; color: white; }
  .btn-secondary:hover:not(:disabled) { background: #5a6268; }
  .btn-success { background: #28a745; color: white; }
  .btn-success:hover:not(:disabled) { background: #218838; }
  .btn-danger { background: #dc3545; color: white; }
  .btn-danger:hover:not(:disabled) { background: #c82333; }
  .btn-info { background: #17a2b8; color: white; }
  .btn-info:hover:not(:disabled) { background: #138496; }
  .btn-small { padding: 6px 12px; font-size: 13px; }
  .breadcrumb { background: white; padding: 15px 30px; margin: 0 20px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .breadcrumb-item { cursor: pointer; color: #667eea; margin-right: 8px; font-weight: 500; transition: color 0.2s; }
  .breadcrumb-item:hover { text-decoration: underline; color: #5568d3; }
  .breadcrumb-item:after { content: " › "; color: #999; margin-left: 8px; }
  .breadcrumb-item:last-child:after { content: ""; }
  .file-list-container { margin: 0 20px 20px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .file-table { width: 100%; border-collapse: collapse; }
  .file-table th, .file-table td { padding: 16px; text-align: left; border-bottom: 1px solid #f0f0f0; }
  .file-table th { background: #f8f9fa; font-weight: 600; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .file-table tbody tr { transition: background 0.2s; }
  .file-table tbody tr:hover { background: #f8f9ff; }
  .file-icon { margin-right: 8px; font-size: 18px; }
  .file-name { cursor: pointer; color: #333; font-weight: 500; transition: color 0.2s; }
  .file-name:hover { color: #667eea; }
  .file-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal-content { background: white; padding: 30px; border-radius: 16px; min-width: 500px; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: modalIn 0.3s ease-out; }
  @keyframes modalIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  .modal-content h3 { margin-bottom: 20px; color: #667eea; font-size: 20px; }
  .modal-actions { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
  .modal input, .modal select { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: border-color 0.3s; }
  .modal input:focus, .modal select:focus { outline: none; border-color: #667eea; }
  .modal label { display: block; margin-bottom: 8px; color: #666; font-weight: 500; font-size: 14px; }
  .toast { position: fixed; bottom: 30px; right: 30px; background: #333; color: white; padding: 16px 24px; border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.3); z-index: 2000; animation: slideIn 0.3s ease-out; font-weight: 500; max-width: 400px; }
  .toast.success { background: linear-gradient(135deg, #28a745, #20c997); }
  .toast.error { background: linear-gradient(135deg, #dc3545, #c82333); }
  .toast.info { background: linear-gradient(135deg, #667eea, #764ba2); }
  @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .upload-progress { margin-top: 10px; }
  .upload-file-item { margin-bottom: 18px; padding: 16px; background: #f8f9fa; border-radius: 10px; border: 2px solid #e9ecef; }
  .upload-file-name { font-weight: 600; margin-bottom: 10px; color: #333; font-size: 14px; word-break: break-all; }
  .progress-bar { width: 100%; height: 36px; background: #e9ecef; border-radius: 18px; overflow: hidden; position: relative; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; }
  .progress-text { text-align: left; margin-top: 8px; font-size: 13px; color: #666; }
  .upload-speed { color: #28a745; font-weight: 700; }`;
    return new Response(css, {
      headers: { 'Content-Type': 'text/css; charset=utf-8' }
    });
  }
  
  // ================================================================
  // JavaScript - 前端逻辑（简化版，无分片上传）
  // ================================================================
  function serveJS(env) {
    const r2PublicDomain = env.R2_PUBLIC_DOMAIN || '';
    
    const js = `
  const R2_PUBLIC_DOMAIN = '${r2PublicDomain}';
  const MAX_RETRIES = 5;
  const RETRY_DELAY_BASE = 1000;
  
  class FileManager {
      constructor() {
          this.currentPath = '';
          this.selectedFiles = new Set();
          this.cancelUpload = false;
          this.currentXHR = null;
          this.isAuthenticated = false;
          this.init();
      }
  
      init() {
          this.bindEvents();
          this.checkAuth();
      }
  
      bindEvents() {
          document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
          document.getElementById('logout-btn').addEventListener('click', () => this.logout());
          document.getElementById('create-folder-btn').addEventListener('click', () => this.showCreateFolderModal());
          document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('file-input').click());
          document.getElementById('move-selected-btn').addEventListener('click', () => this.showMoveModal());
          document.getElementById('delete-selected-btn').addEventListener('click', () => this.deleteSelected());
          document.getElementById('download-selected-btn').addEventListener('click', () => this.downloadSelected());
          document.getElementById('select-all').addEventListener('change', (e) => this.toggleSelectAll(e));
          document.getElementById('file-input').addEventListener('change', (e) => this.handleFileUpload(e));
          document.getElementById('modal-cancel').addEventListener('click', () => this.handleModalCancel());
          document.getElementById('modal-confirm').addEventListener('click', () => this.handleModalConfirm());
      }
  
      showToast(msg, type = 'info') {
          const toast = document.getElementById('toast');
          toast.textContent = msg;
          toast.className = 'toast ' + type;
          setTimeout(() => toast.classList.add('hidden'), 3000);
      }
  
      showLoading(msg = '处理中...') {
          const toast = document.getElementById('toast');
          toast.innerHTML = \`<div style="display:flex;align-items:center;gap:10px">
              <div style="width:20px;height:20px;border:3px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
              <span>\${msg}</span>
          </div>\`;
          toast.className = 'toast info';
          
          if (!document.getElementById('spin-style')) {
              const style = document.createElement('style');
              style.id = 'spin-style';
              style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
              document.head.appendChild(style);
          }
      }
  
      hideLoading() {
          document.getElementById('toast').classList.add('hidden');
      }
  
      async checkAuth() {
          const token = localStorage.getItem('filemanager_token');
          if (token && await this.validateToken(token)) {
              this.isAuthenticated = true;
              this.updateUIForAuth(true);
          } else {
              this.isAuthenticated = false;
              this.updateUIForAuth(false);
          }
          this.loadFileList();
      }
  
      updateUIForAuth(isAuth) {
          const loginBtn = document.getElementById('login-btn');
          const logoutBtn = document.getElementById('logout-btn');
          const toolbar = document.getElementById('admin-toolbar');
          const userBadge = document.getElementById('user-badge');
          const checkboxHeader = document.getElementById('checkbox-header');
          
          if (isAuth) {
              loginBtn.classList.add('hidden');
              logoutBtn.classList.remove('hidden');
              toolbar.classList.remove('hidden');
              userBadge.textContent = '管理员';
              userBadge.className = 'badge admin';
              checkboxHeader.style.display = '';
          } else {
              loginBtn.classList.remove('hidden');
              logoutBtn.classList.add('hidden');
              toolbar.classList.add('hidden');
              userBadge.textContent = '游客模式';
              userBadge.className = 'badge guest';
              checkboxHeader.style.display = 'none';
          }
      }
  
      async validateToken(token) {
          try {
              const res = await fetch('/api/validate', { headers: { 'Authorization': token } });
              return res.ok;
          } catch { return false; }
      }
  
      showLoginModal() {
          this.showModal('🔐 管理员登录', \`
              <input type="password" id="login-password" placeholder="请输入管理员密码" autocomplete="current-password">
          \`, 'login');
          setTimeout(() => document.getElementById('login-password')?.focus(), 100);
      }
  
      async handleLogin(password) {
          try {
              const res = await fetch('/api/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password })
              });
  
              if (res.ok) {
                  const data = await res.json();
                  localStorage.setItem('filemanager_token', data.token);
                  this.isAuthenticated = true;
                  this.updateUIForAuth(true);
                  this.loadFileList();
                  this.showToast('✓ 登录成功', 'success');
                  return true;
              } else {
                  this.showToast('✗ 密码错误', 'error');
                  return false;
              }
          } catch { 
              this.showToast('✗ 登录失败', 'error'); 
              return false;
          }
      }
  
      logout() {
          localStorage.removeItem('filemanager_token');
          this.isAuthenticated = false;
          this.selectedFiles.clear();
          this.updateUIForAuth(false);
          this.loadFileList();
          this.showToast('✓ 已退出', 'info');
      }
  
      async loadFileList(path = '') {
          this.currentPath = path;
          this.updateBreadcrumb();
          
          try {
              const res = await fetch('/api/list?path=' + encodeURIComponent(path));
              if (res.ok) {
                  const files = await res.json();
                  this.renderFileList(files);
              } else {
                  this.showToast('加载失败', 'error');
              }
          } catch (err) { 
              this.showToast('加载失败', 'error'); 
          }
      }
  
      renderFileList(files) {
          const tbody = document.getElementById('file-list');
          tbody.innerHTML = '';
  
          if (files.length === 0) {
              const colspan = this.isAuthenticated ? 5 : 4;
              tbody.innerHTML = \`<tr><td colspan="\${colspan}" style="text-align:center;color:#999;padding:50px"><div style="font-size:48px">📭</div><div style="margin-top:10px">空文件夹</div></td></tr>\`;
              return;
          }
  
          files.forEach(file => {
              const tr = document.createElement('tr');
              const isFolder = file.name.endsWith('/');
              const displayName = isFolder ? file.name.slice(0, -1) : file.name;
              
              let html = '';
              
              if (this.isAuthenticated) {
                  html += \`<td><input type="checkbox" class="file-checkbox" data-name="\${this.esc(file.name)}"></td>\`;
              }
              
              html += \`
                  <td>
                      <span class="file-icon">\${isFolder ? '📁' : '📄'}</span>
                      <span class="file-name" data-name="\${this.esc(file.name)}" data-type="\${isFolder ? 'folder' : 'file'}">
                          \${this.esc(displayName)}
                      </span>
                  </td>
                  <td>\${isFolder ? '-' : this.formatSize(file.size)}</td>
                  <td>\${new Date(file.uploaded).toLocaleString('zh-CN')}</td>
              \`;
              
              html += '<td class="file-actions">';
              if (!isFolder) {
                  html += \`<button class="btn btn-primary btn-small" data-action="download" data-name="\${this.esc(file.name)}">下载</button>\`;
                  if (R2_PUBLIC_DOMAIN) {
                      html += \`<button class="btn btn-success btn-small" data-action="copy" data-name="\${this.esc(file.name)}">链接</button>\`;
                  }
              }
              
              if (this.isAuthenticated) {
                  html += \`
                      <button class="btn btn-info btn-small" data-action="move" data-name="\${this.esc(file.name)}">移动</button>
                      <button class="btn btn-secondary btn-small" data-action="rename" data-name="\${this.esc(file.name)}">改名</button>
                      <button class="btn btn-danger btn-small" data-action="delete" data-name="\${this.esc(file.name)}">删</button>
                  \`;
              }
              html += '</td>';
              
              tr.innerHTML = html;
              tbody.appendChild(tr);
          });
  
          if (this.isAuthenticated) {
              document.querySelectorAll('.file-checkbox').forEach(cb => {
                  cb.addEventListener('change', (e) => {
                      const name = e.target.getAttribute('data-name');
                      e.target.checked ? this.selectedFiles.add(name) : this.selectedFiles.delete(name);
                  });
              });
          }
  
          document.querySelectorAll('.file-name').forEach(el => {
              el.addEventListener('click', (e) => {
                  const name = e.target.getAttribute('data-name');
                  const type = e.target.getAttribute('data-type');
                  if (type === 'folder') {
                      const folderName = name.endsWith('/') ? name.slice(0, -1) : name;
                      const newPath = this.currentPath ? \`\${this.currentPath}/\${folderName}\` : folderName;
                      this.loadFileList(newPath);
                  }
              });
          });
  
          document.querySelectorAll('[data-action]').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  const action = e.target.getAttribute('data-action');
                  const name = e.target.getAttribute('data-name');
                  
                  if (action === 'download') this.downloadFile(name);
                  else if (action === 'copy') this.copyLink(name);
                  else if (action === 'move') {
                      if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
                      this.showMoveModal([name]);
                  }
                  else if (action === 'rename') {
                      if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
                      this.showRenameModal(name);
                  }
                  else if (action === 'delete') {
                      if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
                      this.deleteFile(name);
                  }
              });
          });
      }
  
      esc(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
      }
  
      toggleSelectAll(e) {
          const checkboxes = document.querySelectorAll('.file-checkbox');
          this.selectedFiles.clear();
          checkboxes.forEach(cb => {
              cb.checked = e.target.checked;
              if (e.target.checked) {
                  this.selectedFiles.add(cb.getAttribute('data-name'));
              }
          });
      }
  
      updateBreadcrumb() {
          const breadcrumb = document.getElementById('breadcrumb');
          const parts = this.currentPath.split('/').filter(p => p);
          
          let html = '<span class="breadcrumb-item" data-path="">📂 根目录</span>';
          let currentPath = '';
          
          parts.forEach(part => {
              currentPath += (currentPath ? '/' : '') + part;
              html += \`<span class="breadcrumb-item" data-path="\${this.esc(currentPath)}">\${this.esc(part)}</span>\`;
          });
          
          breadcrumb.innerHTML = html;
          breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
              item.addEventListener('click', (e) => this.loadFileList(e.target.getAttribute('data-path')));
          });
      }
  
      showCreateFolderModal() {
          if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
          this.showModal('新建文件夹', '<input type="text" id="folder-name" placeholder="文件夹名称">', 'create');
          setTimeout(() => document.getElementById('folder-name')?.focus(), 100);
      }
  
      showRenameModal(fileName) {
          const isFolder = fileName.endsWith('/');
          const displayName = isFolder ? fileName.slice(0, -1) : fileName;
          
          this.currentRenameFile = fileName;
          this.showModal('重命名', \`
              <label>当前名称: <strong>\${this.esc(displayName)}</strong></label>
              <input type="text" id="new-name" value="\${this.esc(displayName)}">
          \`, 'rename');
          
          setTimeout(() => {
              const input = document.getElementById('new-name');
              if (input) { input.focus(); input.select(); }
          }, 100);
      }
  
      async showMoveModal(fileNames = null) {
          const filesToMove = fileNames || Array.from(this.selectedFiles);
          
          if (filesToMove.length === 0) {
              this.showToast('请选择文件', 'error');
              return;
          }
  
          this.showLoading('正在加载文件夹列表...');
          const folders = await this.getAllFolders();
          this.hideLoading();
  
          let html = \`
              <label>选择目标文件夹：</label>
              <select id="target-folder" style="margin-bottom:15px">
                  <option value="">/ (根目录)</option>
                  \${folders.map(f => \`<option value="\${this.esc(f)}">/\${this.esc(f)}</option>\`).join('')}
              </select>
              <p style="color:#666;font-size:13px;margin-bottom:8px">或输入新路径：</p>
              <input type="text" id="custom-path" placeholder="例如: folder1/folder2">
              <p style="margin-top:10px;color:#999;font-size:12px">将移动 \${filesToMove.length} 个文件/文件夹</p>
          \`;
          
          this.filesToMove = filesToMove;
          this.showModal('📦 移动文件', html, 'move');
      }
  
      async getAllFolders(prefix = '', result = []) {
          try {
              const res = await fetch('/api/list?path=' + encodeURIComponent(prefix));
              if (res.ok) {
                  const files = await res.json();
                  const folders = files.filter(f => f.name.endsWith('/'));
                  
                  for (const folder of folders) {
                      const fullPath = prefix ? \`\${prefix}/\${folder.name.slice(0, -1)}\` : folder.name.slice(0, -1);
                      if (fullPath !== this.currentPath) {
                          result.push(fullPath);
                      }
                      if (prefix.split('/').length < 5) {
                          await this.getAllFolders(fullPath, result);
                      }
                  }
              }
          } catch (err) {
              console.error('获取文件夹失败:', err);
          }
          return result;
      }
  
      copyLink(fileName) {
          if (!R2_PUBLIC_DOMAIN) return this.showToast('未配置域名', 'error');
          const fullPath = this.currentPath ? \`\${this.currentPath}/\${fileName}\` : fileName;
          const url = \`\${R2_PUBLIC_DOMAIN}/\${encodeURIComponent(fullPath)}\`;
          if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(url).then(() => this.showToast('✓ 已复制', 'success'));
          }
      }
  
      async handleFileUpload(e) {
          if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
          const files = Array.from(e.target.files);
          if (files.length === 0) return;
          await this.uploadFiles(files);
          e.target.value = '';
      }
  
      // ============================================================
      // 上传相关方法（简化版，带重试）
      // ============================================================
  
      async uploadFiles(files) {
          this.cancelUpload = false;
          this.showUploadModal(files);
  
          let uploaded = 0;
          const startTime = Date.now();
  
          for (let i = 0; i < files.length; i++) {
              if (this.cancelUpload) break;
              try {
                  await this.uploadSingleFile(files[i], i);
                  uploaded++;
                  this.markComplete(i);
              } catch (err) {
                  console.error('[上传错误]', files[i].name, err);
                  this.markError(i, err.message);
              }
          }
  
          setTimeout(() => {
              this.hideModal();
              this.loadFileList(this.currentPath);
              const time = ((Date.now() - startTime) / 1000).toFixed(1);
              this.showToast(\`✓ 完成 \${uploaded}/\${files.length} (\${time}s)\`, 'success');
          }, 1500);
      }
  
      async uploadSingleFile(file, idx) {
          const uploadFn = async () => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('path', this.currentPath);
              formData.append('fileName', file.name);
  
              return new Promise((resolve, reject) => {
                  const xhr = new XMLHttpRequest();
                  this.currentXHR = xhr;
                  
                  let lastTime = Date.now();
                  let lastLoaded = 0;
  
                  xhr.upload.addEventListener('progress', (e) => {
                      if (e.lengthComputable) {
                          const progress = (e.loaded / e.total) * 100;
                          const now = Date.now();
                          const speed = (e.loaded - lastLoaded) / ((now - lastTime) / 1000);
                          this.updateProgress(idx, progress, speed);
                          lastTime = now;
                          lastLoaded = e.loaded;
                      }
                  });
  
                  xhr.addEventListener('load', () => {
                      this.currentXHR = null;
                      if (xhr.status >= 200 && xhr.status < 300) {
                          resolve();
                      } else {
                          reject(new Error(\`HTTP \${xhr.status}\`));
                      }
                  });
  
                  xhr.addEventListener('error', () => {
                      this.currentXHR = null;
                      reject(new Error('网络错误'));
                  });
                  
                  xhr.addEventListener('abort', () => {
                      this.currentXHR = null;
                      reject(new Error('已取消'));
                  });
  
                  xhr.open('POST', '/api/upload');
                  xhr.setRequestHeader('Authorization', localStorage.getItem('filemanager_token'));
                  xhr.send(formData);
              });
          };
  
          return await this.retryOperation(uploadFn, idx, file.name);
      }
  
      async retryOperation(operation, idx, fileName) {
          let lastError = null;
          
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
              try {
                  if (this.cancelUpload) throw new Error('用户取消');
  
                  if (attempt > 0) {
                      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
                      this.updateProgressText(idx, \`⏳ 重试中 (\${attempt}/\${MAX_RETRIES - 1})...\`);
                      await this.sleep(delay);
                  }
  
                  await operation();
                  return;
              } catch (err) {
                  lastError = err;
                  if (err.message === '用户取消' || err.message === '已取消') throw err;
                  if (attempt === MAX_RETRIES - 1) {
                      throw new Error(\`上传失败（已重试\${MAX_RETRIES}次）: \${err.message}\`);
                  }
              }
          }
          throw lastError;
      }
  
      sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
      }
  
      showUploadModal(files) {
          let html = '<div class="upload-progress">';
          files.forEach((file, i) => {
              html += \`
                  <div class="upload-file-item">
                      <div class="upload-file-name">🚀 \${this.esc(file.name)} (\${this.formatSize(file.size)})</div>
                      <div class="progress-bar">
                          <div class="progress-fill" id="progress-\${i}" style="width:0%">0%</div>
                      </div>
                      <div class="progress-text" id="text-\${i}">准备中...</div>
                  </div>
              \`;
          });
          html += '</div>';
          this.showModal('🚀 上传文件', html, 'upload');
          document.getElementById('modal-cancel').textContent = '取消上传';
          document.getElementById('modal-cancel').style.display = 'inline-block';
          document.getElementById('modal-confirm').style.display = 'none';
      }
  
      updateProgress(idx, progress, speed) {
          const fill = document.getElementById(\`progress-\${idx}\`);
          const text = document.getElementById(\`text-\${idx}\`);
          
          if (fill) {
              const p = Math.min(100, Math.max(0, progress));
              fill.style.width = p.toFixed(1) + '%';
              fill.textContent = p.toFixed(1) + '%';
          }
          
          if (text && speed > 0) {
              text.innerHTML = \`🚀 <span class="upload-speed">\${this.formatSize(speed)}/s</span>\`;
          }
      }
  
      updateProgressText(idx, message) {
          const text = document.getElementById(\`text-\${idx}\`);
          if (text) {
              text.textContent = message;
              text.style.color = '#ffa500';
          }
      }
  
      markComplete(idx) {
          const fill = document.getElementById(\`progress-\${idx}\`);
          const text = document.getElementById(\`text-\${idx}\`);
          if (fill) { fill.style.width = '100%'; fill.textContent = '✓'; }
          if (text) { text.textContent = '✓ 上传完成'; text.style.color = '#28a745'; }
      }
  
      markError(idx, msg) {
          const fill = document.getElementById(\`progress-\${idx}\`);
          const text = document.getElementById(\`text-\${idx}\`);
          if (fill) { fill.style.background = '#dc3545'; fill.textContent = '✗'; }
          if (text) { text.textContent = '✗ ' + msg; text.style.color = '#dc3545'; }
      }
  
      async deleteFile(fileName) {
          if (!confirm('确定删除?')) return;
          this.showLoading('正在删除...');
          try {
              const res = await fetch('/api/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                  body: JSON.stringify({ path: this.currentPath, files: [fileName] })
              });
              this.hideLoading();
              if (res.ok) { 
                  this.showToast('✓ 删除成功', 'success'); 
                  this.loadFileList(this.currentPath); 
              } else {
                  this.showToast('✗ 删除失败', 'error');
              }
          } catch { 
              this.hideLoading();
              this.showToast('✗ 删除失败', 'error'); 
          }
      }
  
      async deleteSelected() {
          if (!this.isAuthenticated) return this.showToast('请先登录', 'error');
          if (this.selectedFiles.size === 0) return this.showToast('请选择文件', 'error');
          if (!confirm(\`确定删除 \${this.selectedFiles.size} 个?\`)) return;
          
          this.showLoading(\`正在删除 \${this.selectedFiles.size} 个...\`);
          try {
              const res = await fetch('/api/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                  body: JSON.stringify({ path: this.currentPath, files: Array.from(this.selectedFiles) })
              });
              this.hideLoading();
              if (res.ok) { 
                  this.selectedFiles.clear();
                  document.getElementById('select-all').checked = false;
                  this.showToast('✓ 删除成功', 'success'); 
                  this.loadFileList(this.currentPath); 
              } else {
                  this.showToast('✗ 删除失败', 'error');
              }
          } catch { 
              this.hideLoading();
              this.showToast('✗ 删除失败', 'error'); 
          }
      }
  
      async downloadFile(fileName) {
          const fullPath = this.currentPath ? \`\${this.currentPath}/\${fileName}\` : fileName;
          if (R2_PUBLIC_DOMAIN) {
              const url = \`\${R2_PUBLIC_DOMAIN}/\${fullPath.split('/').map(p => encodeURIComponent(p)).join('/')}\`;
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          } else {
              this.showToast('未配置公共域名', 'error');
          }
      }
  
      async downloadSelected() {
          if (this.selectedFiles.size === 0) return this.showToast('请选择文件', 'error');
          const files = Array.from(this.selectedFiles).filter(f => !f.endsWith('/'));
          if (files.length === 0) return this.showToast('请选择文件（非文件夹）', 'error');
          
          this.showToast(\`开始下载 \${files.length} 个文件\`, 'info');
          for (let i = 0; i < files.length; i++) {
              await this.downloadFile(files[i]);
              if (i < files.length - 1) await new Promise(r => setTimeout(r, 800));
          }
          this.showToast(\`✓ 已触发 \${files.length} 个下载\`, 'success');
      }
  
      showModal(title, body, type) {
          this.currentModalType = type;
          document.getElementById('modal-title').textContent = title;
          document.getElementById('modal-body').innerHTML = body;
          document.getElementById('modal-confirm').textContent = '确认';
          document.getElementById('modal-confirm').style.display = 'inline-block';
          document.getElementById('modal-cancel').textContent = '取消';
          document.getElementById('modal-cancel').style.display = 'inline-block';
          document.getElementById('modal').classList.remove('hidden');
      }
  
      hideModal() {
          document.getElementById('modal').classList.add('hidden');
      }
  
      handleModalCancel() {
          if (this.currentModalType === 'upload') {
              if (confirm('确定取消上传?')) {
                  this.cancelUpload = true;
                  if (this.currentXHR) this.currentXHR.abort();
                  this.hideModal();
                  this.showToast('已取消', 'info');
              }
          } else {
              this.hideModal();
          }
      }
  
      async handleModalConfirm() {
          const confirmBtn = document.getElementById('modal-confirm');
          const originalText = confirmBtn.textContent;
          confirmBtn.disabled = true;
          confirmBtn.textContent = '处理中...';
          
          try {
              if (this.currentModalType === 'login') {
                  const password = document.getElementById('login-password')?.value;
                  if (password) {
                      const success = await this.handleLogin(password);
                      if (success) this.hideModal();
                  }
              } else if (this.currentModalType === 'create') {
                  const name = document.getElementById('folder-name')?.value.trim();
                  if (name) {
                      await this.createFolder(name);
                      this.hideModal();
                  }
              } else if (this.currentModalType === 'rename') {
                  const newName = document.getElementById('new-name')?.value.trim();
                  if (newName) {
                      await this.renameFile(this.currentRenameFile, newName);
                      this.hideModal();
                  }
              } else if (this.currentModalType === 'move') {
                  await this.moveFiles();
                  this.hideModal();
              }
          } finally {
              confirmBtn.disabled = false;
              confirmBtn.textContent = originalText;
          }
      }
  
      async createFolder(name) {
          this.showLoading('正在创建文件夹...');
          try {
              const res = await fetch('/api/mkdir', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                  body: JSON.stringify({ path: this.currentPath, name })
              });
              this.hideLoading();
              if (res.ok) { 
                  this.showToast('✓ 创建成功', 'success'); 
                  this.loadFileList(this.currentPath); 
              } else {
                  this.showToast('✗ 创建失败', 'error');
              }
          } catch { 
              this.hideLoading();
              this.showToast('✗ 创建失败', 'error'); 
          }
      }
  
      async renameFile(oldName, newName) {
          const isFolder = oldName.endsWith('/');
          const displayName = isFolder ? oldName.slice(0, -1) : oldName;
          this.showLoading(\`正在重命名 "\${displayName}"...\`);
          try {
              const newNameFinal = isFolder ? newName + '/' : newName;
              const res = await fetch('/api/rename', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                  body: JSON.stringify({ path: this.currentPath, oldName, newName: newNameFinal })
              });
              this.hideLoading();
              if (res.ok) { 
                  this.showToast('✓ 重命名成功', 'success'); 
                  this.loadFileList(this.currentPath); 
              } else {
                  this.showToast('✗ 重命名失败', 'error');
              }
          } catch { 
              this.hideLoading();
              this.showToast('✗ 重命名失败', 'error'); 
          }
      }
  
      async moveFiles() {
          const select = document.getElementById('target-folder');
          const customPath = document.getElementById('custom-path')?.value.trim();
          const targetPath = customPath || select.value;
          this.showLoading(\`正在移动 \${this.filesToMove.length} 个...\`);
          try {
              const res = await fetch('/api/move', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                  body: JSON.stringify({
                      sourcePath: this.currentPath,
                      targetPath: targetPath,
                      files: this.filesToMove
                  })
              });
              this.hideLoading();
              if (res.ok) {
                  this.selectedFiles.clear();
                  document.getElementById('select-all').checked = false;
                  this.showToast('✓ 移动成功', 'success');
                  this.loadFileList(this.currentPath);
              } else {
                  this.showToast('✗ 移动失败', 'error');
              }
          } catch (err) {
              this.hideLoading();
              this.showToast('✗ 移动失败', 'error');
          }
      }
  
      formatSize(bytes) {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }
  
      getAuthHeaders() {
          const token = localStorage.getItem('filemanager_token');
          return token ? { 'Authorization': token } : {};
      }
  }
  
  const fileManager = new FileManager();
  `;
    
    return new Response(js, {
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
    });
  }
  
  // ================================================================
  // 后端 API
  // ================================================================
  async function handleAPI(request, env, url) {
    const path = url.pathname;
    const authResult = await authenticate(request, env);
    
    const publicEndpoints = ['/api/login', '/api/list'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => path === endpoint);
    
    if (!authResult.authenticated && !isPublicEndpoint) {
      return new Response('Unauthorized', { status: 401 });
    }
  
    try {
      switch (path) {
        case '/api/login': return handleLogin(request, env);
        case '/api/validate': return handleValidate();
        case '/api/list': return handleList(request, env, url);
        case '/api/upload': return handleUpload(request, env);
        case '/api/move': return handleMove(request, env);
        case '/api/delete': return handleDelete(request, env);
        case '/api/mkdir': return handleMkdir(request, env);
        case '/api/rename': return handleRename(request, env);
        default: return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('[API Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
  
  async function authenticate(request, env) {
    const token = request.headers.get('Authorization');
    if (!token) return { authenticated: false };
    const expectedToken = await generateToken(env.ADMIN_PASSWORD);
    return { authenticated: token === expectedToken };
  }
  
  async function generateToken(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'fm_complete_v1');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async function handleLogin(request, env) {
    try {
      const { password } = await request.json();
      if (password === env.ADMIN_PASSWORD) {
        const token = await generateToken(env.ADMIN_PASSWORD);
        return new Response(JSON.stringify({ token }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('Invalid', { status: 401 });
    } catch {
      return new Response('Bad request', { status: 400 });
    }
  }
  
  async function handleValidate() {
    return new Response(JSON.stringify({ valid: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  async function handleList(request, env, url) {
    const path = url.searchParams.get('path') || '';
    const prefix = path ? path + '/' : '';
    
    try {
      const objects = await env.MY_R2.list({ prefix, delimiter: '/' });
      const files = [];
      
      if (objects.delimitedPrefixes && objects.delimitedPrefixes.length > 0) {
        for (const fp of objects.delimitedPrefixes) {
          const folderName = fp.substring(prefix.length);
          if (folderName) {
            files.push({ 
              name: folderName, 
              size: 0, 
              uploaded: new Date().toISOString(), 
              etag: '' 
            });
          }
        }
      }
      
      for (const obj of objects.objects) {
        const relativeName = obj.key.substring(prefix.length);
        if (relativeName && !relativeName.includes('/')) {
          files.push({ 
            name: relativeName, 
            size: obj.size, 
            uploaded: obj.uploaded, 
            etag: obj.etag 
          });
        }
      }
  
      files.sort((a, b) => {
        const af = a.name.endsWith('/');
        const bf = b.name.endsWith('/');
        if (af && !bf) return -1;
        if (!af && bf) return 1;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
      
      return new Response(JSON.stringify(files), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      console.error('[API List Error]', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleUpload(request, env) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const path = formData.get('path') || '';
      const fileName = formData.get('fileName');
      
      const key = path ? `${path}/${fileName}` : fileName;
      
      console.log('[Upload] key:', key, 'size:', file.size);
      
      await env.MY_R2.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream'
        }
      });
      
      return new Response('OK');
    } catch (error) {
      console.error('[Upload Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
  
  async function handleMove(request, env) {
    try {
      const { sourcePath, targetPath, files } = await request.json();
      
      for (const fileName of files) {
        const sourceKey = sourcePath ? `${sourcePath}/${fileName}` : fileName;
        const targetKey = targetPath ? `${targetPath}/${fileName}` : fileName;
  
        if (fileName.endsWith('/')) {
          const objects = await env.MY_R2.list({ prefix: sourceKey });
          for (const obj of objects.objects) {
            const relativePath = obj.key.substring(sourceKey.length);
            const newKey = targetKey + relativePath;
            
            const object = await env.MY_R2.get(obj.key);
            if (object) {
              await env.MY_R2.put(newKey, object.body, {
                httpMetadata: object.httpMetadata
              });
              await env.MY_R2.delete(obj.key);
            }
          }
        } else {
          const object = await env.MY_R2.get(sourceKey);
          if (object) {
            await env.MY_R2.put(targetKey, object.body, {
              httpMetadata: object.httpMetadata
            });
            await env.MY_R2.delete(sourceKey);
          }
        }
      }
  
      return new Response('OK');
    } catch (error) {
      console.error('[API Move Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
  
  async function handleDelete(request, env) {
    try {
      const { path, files } = await request.json();
      
      for (const file of files) {
        const key = path ? `${path}/${file}` : file;
        
        if (file.endsWith('/')) {
          const objects = await env.MY_R2.list({ prefix: key });
          await Promise.all(objects.objects.map(obj => env.MY_R2.delete(obj.key)));
        } else {
          await env.MY_R2.delete(key);
        }
      }
      return new Response('OK');
    } catch (error) {
      console.error('[API Delete Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
  
  async function handleMkdir(request, env) {
    try {
      const { path, name } = await request.json();
      const key = path ? `${path}/${name}/` : `${name}/`;
      
      await env.MY_R2.put(key, new Uint8Array(0));
      return new Response('OK');
    } catch (error) {
      console.error('[API Mkdir Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
  
  async function handleRename(request, env) {
    try {
      const { path, oldName, newName } = await request.json();
      const oldKey = path ? `${path}/${oldName}` : oldName;
      const newKey = path ? `${path}/${newName}` : newName;
  
      if (oldName.endsWith('/')) {
        const objects = await env.MY_R2.list({ prefix: oldKey });
        for (const obj of objects.objects) {
          const rel = obj.key.substring(oldKey.length);
          const object = await env.MY_R2.get(obj.key);
          if (object) {
            await env.MY_R2.put(newKey + rel, object.body, { httpMetadata: object.httpMetadata });
            await env.MY_R2.delete(obj.key);
          }
        }
      } else {
        const object = await env.MY_R2.get(oldKey);
        if (!object) {
          return new Response('Not found', { status: 404 });
        }
        await env.MY_R2.put(newKey, object.body, { httpMetadata: object.httpMetadata });
        await env.MY_R2.delete(oldKey);
      }
  
      return new Response('OK');
    } catch (error) {
      console.error('[API Rename Error]', error);
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
