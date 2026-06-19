---
layout: default
title: "网页组件活字典 | Web Component Dictionary"
description: "26个可直接使用的网页组件，选需求→看效果→复制代码，支持中英双语"
---

<style>
.component-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.component-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}
.component-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.2em;
}
.component-header p {
  margin: 5px 0;
  font-size: 1.1em;
  opacity: 0.95;
}
.widget-container {
  width: 100%;
  height: 800px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 20px 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.widget-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.demo-note {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 15px 20px;
  margin: 20px 0;
  border-radius: 4px;
}
.demo-note h3 {
  margin-top: 0;
  color: #667eea;
}
.component-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin: 20px 0;
}
.component-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}
.component-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}
.component-card h4 {
  margin: 0 0 8px 0;
  color: #333;
}
.component-card p {
  margin: 0;
  font-size: 0.9em;
  color: #666;
}
.buy-button {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  margin: 10px 5px;
  transition: all 0.3s;
}
.buy-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>

<div class="component-page">
  <div class="component-header">
    <h1>📖 网页组件活字典</h1>
    <p>Web Component Dictionary</p>
    <p>26个可直接使用的网页组件 | 选需求 → 看效果 → 复制代码</p>
  </div>

  <div class="demo-note">
    <h3>🎯 在线演示</h3>
    <p>下方是完整功能的在线演示，您可以：</p>
    <ul>
      <li>🌍 点击右上角 🌍 按钮切换中文/英文</li>
      <li>📱 左侧选择组件，右侧实时预览</li>
      <li>💻 编辑HTML/CSS/JS代码，立即看到效果</li>
      <li>📋 点击"复制代码"按钮，直接使用</li>
    </ul>
  </div>

  <div class="widget-container">
    <iframe src="widget.html" title="Web Component Dictionary Demo"></iframe>
  </div>

  <div class="demo-note">
    <h3>📦 获取完整版</h3>
    <p>在线演示版包含全部26个组件。如需下载完整版（含README、免责声明等），请访问：</p>
    <p>
      <a href="https://segauser.gumroad.com/l/mpsavm" class="buy-button">Gumroad $9.99</a>
      <a href="https://payhip.com/b/S9pj2" class="buy-button">Payhip $9.99</a>
    </p>
    <p><small>购买后终身免费更新，v2.0将补充至60个组件！</small></p>
  </div>

  <h2>📋 组件清单（26个）</h2>
  
  <h3>导航类（5个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>📍 固定顶部导航栏</h4>
      <p>滚动时始终固定在顶部，支持响应式折叠</p>
    </div>
    <div class="component-card">
      <h4>🍔 汉堡菜单</h4>
      <p>移动端友好的导航菜单，点击展开/收起</p>
    </div>
    <div class="component-card">
      <h4>⬆️ 返回顶部按钮</h4>
      <p>滚动超过一定距离后显示，平滑滚动到顶部</p>
    </div>
    <div class="component-card">
      <h4>📑 Tab切换面板</h4>
      <p>多个内容面板切换，支持动画过渡</p>
    </div>
    <div class="component-card">
      <h4>🍞 面包屑导航</h4>
      <p>显示当前页面在网站结构中的位置</p>
    </div>
  </div>

  <h3>内容展示（5个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>🖼️ 响应式图片轮播图</h4>
      <p>支持自动播放、手势滑动、指示器</p>
    </div>
    <div class="component-card">
      <h4>🃏 卡片网格布局</h4>
      <p>响应式卡片布局，自动适应屏幕尺寸</p>
    </div>
    <div class="component-card">
      <h4>📦 手风琴折叠</h4>
      <p>点击展开/收起内容，支持单个或多个展开</p>
    </div>
    <div class="component-card">
      <h4>🖼️ 模态弹窗</h4>
      <p>弹出式对话框，支持ESC关闭、点击背景关闭</p>
    </div>
    <div class="component-card">
      <h4>🔔 Toast通知</h4>
      <p>轻量级通知提示，自动消失，支持多种类型</p>
    </div>
  </div>

  <h3>表单交互（4个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>✅ 实时表单验证</h4>
      <p>输入时实时验证，支持多种验证规则</p>
    </div>
    <div class="component-card">
      <h4>👁️ 密码显示切换</h4>
      <p>点击眼睛图标显示/隐藏密码</p>
    </div>
    <div class="component-card">
      <h4>📎 文件上传预览</h4>
      <p>上传前预览图片，支持拖拽上传</p>
    </div>
    <div class="component-card">
      <h4>🏷️ 多选标签输入</h4>
      <p>输入标签后回车，可删除，类似Gmail收件人</p>
    </div>
  </div>

  <h3>特效动画（4个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>🔢 数字递增动画</h4>
      <p>页面滚动到可视区域时触发数字递增效果</p>
    </div>
    <div class="component-card">
      <h4>⌨️ 打字机效果</h4>
      <p>文字逐个显示，模拟打字效果</p>
    </div>
    <div class="component-card">
      <h4>🌙 暗黑模式切换</h4>
      <p>切换亮色/暗色主题，保存用户偏好</p>
    </div>
    <div class="component-card">
      <h4>⏳ 加载动画</h4>
      <p>多种加载动画效果（旋转、脉冲、波浪等）</p>
    </div>
  </div>

  <h3>实用工具（4个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>📋 复制到剪贴板</h4>
      <p>点击按钮复制文本，显示成功提示</p>
    </div>
    <div class="component-card">
      <h4>⏰ 倒计时器</h4>
      <p>可自定义目标的倒计时，支持暂停/重置</p>
    </div>
    <div class="component-card">
      <h4>🎲 随机数生成器</h4>
      <p>指定范围内生成随机数，支持历史记录</p>
    </div>
    <div class="component-card">
      <h4>🔐 Base64编解码</h4>
      <p>文本与Base64互转，支持UTF-8</p>
    </div>
  </div>

  <h3>布局模板（4个）</h3>
  <div class="component-list">
    <div class="component-card">
      <h4>🏗️ 圣杯布局</h4>
      <p>经典三栏布局，左右固定，中间自适应</p>
    </div>
    <div class="component-card">
      <h4>📌 粘性页脚</h4>
      <p>内容不足时页脚贴在底部，内容多时正常推送</p>
    </div>
    <div class="component-card">
      <h4>📊 卡片仪表盘</h4>
      <p>数据展示面板，包含卡片、图表、表格</p>
    </div>
    <div class="component-card">
      <h4>🔐 登录页布局</h4>
      <p>居中登录表单，支持社交登录按钮</p>
    </div>
  </div>

  <div class="demo-note">
    <h3>🚀 使用方法</h3>
    <ol>
      <li>在线使用：本页面直接体验全部功能</li>
      <li>下载完整版：购买后下载ZIP包</li>
      <li>解压后双击 <code>widget.html</code> 用浏览器打开</li>
      <li>左侧选择组件 → 右侧实时预览 → 复制代码</li>
      <li>粘贴到你的项目中直接使用</li>
    </ol>
  </div>

  <div class="demo-note">
    <h3>⚠️ 免责声明</h3>
    <p>本品按"原样"提供，不提供任何明示或暗示的担保。</p>
    <p>使用者需自行承担使用风险。详见 <a href="https://github.com/wdsega/WDSEGA.github.io/blob/main/web-components/DISCLAIMER.md">DISCLAIMER.md</a></p>
  </div>
</div>
