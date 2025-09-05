// ChatGPT 会话内容解析与导出脚本
(function() {
  if (!location.hostname.includes('chat.openai.com') && !location.hostname.includes('chatgpt.com')) return;

  const buttonStyle = `
    position: fixed;
    top: 100px;
    right: 32px;
    z-index: 9999;
    background: #10a37f;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  `;

  function createExportButton() {
    if (document.getElementById('ai-threadstash-export-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ai-threadstash-export-btn';
    btn.innerText = '导出会话';
    btn.setAttribute('style', buttonStyle);
    btn.onclick = exportChat;
    document.body.appendChild(btn);
  }

  function parseChat() {
    // 新版 chatgpt.com 页面结构适配
    // 1. 查找所有 role=user/assistant 的消息块
    // 2. 兼容 markdown、纯文本等内容，保留HTML结构
    const result = [];
    // 先尝试新版结构（如 .flex.flex-col.items-center > .w-full）
    const conversationRoot = document.querySelector('main');
    if (conversationRoot) {
      const messageBlocks = conversationRoot.querySelectorAll('div[data-message-author-role]');
      messageBlocks.forEach(block => {
        const role = block.getAttribute('data-message-author-role');
        // 优先找 markdown 内容
        let contentElement = block.querySelector('.markdown');
        if (!contentElement) {
          // 兼容纯文本
          contentElement = block;
        }
        const content = extractCleanContent(contentElement);
        result.push({ role, content });
      });
      if (result.length) return result;
    }
    // 兼容旧结构
    const oldBlocks = document.querySelectorAll('[data-testid="conversation-turn"]');
    oldBlocks.forEach(block => {
      const role = block.querySelector('div.items-start')?.innerText?.includes('ChatGPT') ? 'assistant' : 'user';
      const contentElement = block.querySelector('div.markdown, .whitespace-pre-wrap') || block;
      const content = extractCleanContent(contentElement);
      result.push({ role, content });
    });
    return result;
  }

  // 提取清理后的内容，保留HTML结构
  function extractCleanContent(element) {
    const clone = element.cloneNode(true);

    // 移除按钮、SVG、图片和其他不需要的元素
    const elementsToRemove = clone.querySelectorAll('button, svg, img, .copy, .edit, .icon, [class*="icon"], [class*="button"]');
    elementsToRemove.forEach(el => el.remove());

    const text = clone.textContent.trim();
    const html = clone.innerHTML;

    return {
        text: text,
        html: html
    };
  }

  // 根据页面标题与内容生成会话标题
  function buildTitle(chat) {
    let t = (document.title || '').trim();
    // 移除可能存在的 ChatGPT 后缀（-、–、| 等分隔符）
    t = t.replace(/\s*[-|–]\s*ChatGPT.*$/i, '')
         .replace(/\s*[-|–]\s*OpenAI.*$/i, '')
         .replace(/\s*\|\s*ChatGPT.*$/i, '')
         .trim();

    // 过滤无效标题
    if (!t || /^(chatgpt|new chat|新的对话)$/i.test(t)) {
      const firstUser = (chat.find(m => String(m.role).toLowerCase() === 'user') || {}).text || '';
      t = firstUser ? firstUser.trim().slice(0, 40) : '会话';
    }

    return `${t} - ChatGPT`;
  }

  function exportChat() {
    const chat = parseChat();
    if (!chat.length) {
      console.log('[AI-ThreadStash] No chat content found');
      return false;
    }
    const title = buildTitle(chat);
    
    // Convert to preview format
    const messages = chat.map(msg => {
      const author = msg.role === 'user' ? 'User' : 'Assistant';
      let content = '';
      if (msg.content) {
        if (typeof msg.content === 'object') {
          // 优先使用清理后的 HTML，以最大化保留列表/代码块等格式
          if (msg.content.html && String(msg.content.html).trim().length > 0) {
            content = String(msg.content.html);
          } else if (msg.content.text) {
            content = String(msg.content.text);
          }
        } else if (typeof msg.content === 'string') {
          content = msg.content;
        }
      }
      return { author, content };
    });
    
    // Send to background script for preview page handling
    chrome.runtime.sendMessage({
      action: 'chatgpt-content-ready',
      data: { title, messages }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AI-ThreadStash] Failed to send ChatGPT content:', chrome.runtime.lastError.message);
      } else {
        console.log('[AI-ThreadStash] ChatGPT content sent successfully');
      }
    });
    
    return true;
  }

  window.addEventListener('load', createExportButton);
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(createExportButton, 500);
    }
  }, 1000);

  // 监听来自popup的消息
  chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
      console.log('[AI-ThreadStash] Received ping from popup');
      sendResponse({ success: true, message: 'ChatGPT content script ready' });
      return true;
    }
    
    if (request.action === 'export-chatgpt') {
      const success = exportChat();
      sendResponse({ success });
    } else if (request.action === 'export-chatgpt-content') {
      console.log('[AI-ThreadStash] Received export-chatgpt-content request');
      try {
        sendResponse({ success: true, message: 'Export started' });
        const success = exportChat();
        if (!success) {
          chrome.runtime.sendMessage({
            action: 'chatgpt-content-failed',
            error: 'No conversation content found'
          });
        }
      } catch (error) {
        chrome.runtime.sendMessage({
          action: 'chatgpt-content-failed',
          error: error.message
        });
      }
      return true; // async response
    }
  });
})();