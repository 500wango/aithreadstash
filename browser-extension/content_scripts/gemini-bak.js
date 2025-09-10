// Gemini 会话内容解析与导出脚本
(function() {
  if (!location.hostname.includes('gemini.google.com')) return;
  
  // 检查扩展上下文是否有效
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    console.warn('Extension context not available or invalidated');
    return;
  }

  const buttonStyle = `
    position: fixed;
    top: 100px;
    right: 32px;
    z-index: 9999;
    background: #8ab4f8;
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
    const result = [];
    console.log('Starting parseChat for Gemini');
    console.log('Current URL:', window.location.href);
    console.log('Document title:', document.title);
    
    // 首先尝试查找Gemini特定的对话容器
    const conversationContainer = document.querySelector('chat-window, [role="main"], main');
    console.log('Conversation container found:', conversationContainer);
    
    // 调试：检查页面上的所有主要容器
    console.log('Checking all main containers on page:');
    const mainContainers = document.querySelectorAll('main, [role="main"], chat-window, .conversation-container, .chat-container');
    mainContainers.forEach((container, index) => {
      console.log(`   Container ${index}: tag=${container.tagName}, classes=${container.className}, textLength=${container.textContent.length}`);
      console.log(`   Container ${index} first 100 chars: "${container.textContent.substring(0, 100)}..."`);
    });
    
    if (!conversationContainer) {
      console.log('No conversation container found, trying fallback');
      // 如果找不到明确的容器，尝试更广泛的搜索
      const fallbackContainer = document.querySelector('body');
      if (fallbackContainer) {
        console.log('Using body as fallback container');
        return parseChatWithFallback(fallbackContainer);
      }
      return result;
    }

    // 增强的选择器列表，包含更多可能的Gemini消息选择器
    const selectors = [
      // 用户消息选择器 - 增强版本
      '[data-message-type="USER"], [data-role="user"], .user-message, .human-message, [class*="user"], [class*="human"], [data-author="user"], [data-type="user"], [data-message-author-role="user"], [data-author-role="user"]',
      // 助手消息选择器 - 增强版本  
      '[data-message-type="MODEL"], [data-role="model"], .model-message, .assistant-message, [class*="model"], [class*="assistant"], [data-author="model"], [data-type="model"], [data-message-author-role="model"], [data-author-role="model"], [data-message-author-role="assistant"], [data-author-role="assistant"]'
    ];

    // 查找所有可能的对话消息
    const allMessages = [];
    console.log('Testing all message selectors:');
    selectors.forEach(selector => {
      const elements = conversationContainer.querySelectorAll(selector);
      console.log(`Selector "${selector}" found ${elements.length} elements`);
      
      if (elements.length > 0) {
        console.log(`First element for selector "${selector}":`, elements[0]);
        console.log(`First element text: "${elements[0].textContent.substring(0, 100)}..."`);
        console.log(`First element classes: "${elements[0].className}"`);
        console.log(`First element id: "${elements[0].id}"`);
        console.log(`First element dataset:`, JSON.stringify(elements[0].dataset));
        
        // 检查前3个元素
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const el = elements[i];
          console.log(`   Element ${i}: tag=${el.tagName}, text="${el.textContent.substring(0, 50)}...", role=${selector.includes('USER') || selector.includes('user') || selector.includes('human') ? 'user' : 'assistant'}`);
        }
      }
      
      elements.forEach((el, index) => {
        // 跳过会话历史列表中的元素
        if (isSessionHistoryElement(el)) {
          console.log(`Skipping element ${index} as session history: "${el.textContent.substring(0, 50)}..."`);
          return;
        }
        
        // 跳过噪音元素
        if (isNoise(el)) {
          console.log(`Skipping element ${index} as noise: "${el.textContent.substring(0, 50)}..."`);
          return;
        }
        
        const role = selector.includes('USER') || selector.includes('user') || selector.includes('human') ? 'user' : 'assistant';
        const content = extractCleanContent(el);
        
        if (content && content.text && content.text.length > 10) {
          console.log(`Found ${role} message ${index}: "${content.text.substring(0, 100)}..."`);
          console.log(`Element details: tag=${el.tagName}, classes=${el.className}, id=${el.id}`);
          allMessages.push({ element: el, role, content });
        } else {
          console.log(`Skipping element ${index} - no valid content: "${el.textContent.substring(0, 50)}..."`);
          console.log(`Content details: text=${content?.text?.length}, html=${content?.html?.length}`);
        }
      });
    });

    // 按DOM位置排序
    allMessages.sort((a, b) => {
      const position = a.element.compareDocumentPosition(b.element);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    // 提取排序后的消息
    allMessages.forEach(msg => {
      result.push({ role: msg.role, text: msg.content.text, html: msg.content.html });
    });

    // 如果标准选择器找不到消息，尝试更精确的备用方法
    if (result.length === 0) {
      console.log('Standard selectors found no messages, trying fallback');
      const fallbackResult = parseChatWithFallback(conversationContainer);
      result.push(...fallbackResult);
    }

    console.log(`Total messages found: ${result.length}`);
    
    // 详细的调试输出
    if (result.length > 0) {
      console.log('Message summary:');
      result.forEach((msg, index) => {
        console.log(`   Message ${index} (${msg.role}): "${msg.text.substring(0, 80)}..."`);
      });
      
      const userCount = result.filter(msg => msg.role === 'user').length;
      const assistantCount = result.filter(msg => msg.role === 'assistant').length;
      console.log(`   User messages: ${userCount}, Assistant messages: ${assistantCount}`);
      
      // 检查消息顺序模式
      if (result.length >= 2) {
        console.log('Message sequence pattern:');
        for (let i = 0; i < Math.min(result.length, 5); i++) {
          console.log(`   ${i}: ${result[i].role}`);
        }
      }
    }

    // 去重和最终过滤
    return deduplicateAndFilter(result);
  }

  // 专门的fallback解析函数
  function parseChatWithFallback(container) {
    const result = [];
    console.log('Starting fallback parsing');
    console.log('Container element:', container);
    console.log('Container text length:', container.textContent.length);
    
    // 查找主要对话区域，排除侧边栏和导航
    const conversationArea = findMainConversationArea();
    if (!conversationArea) {
      console.log('No valid conversation area found in fallback');
      return result;
    }
    
    console.log('Found conversation area:', conversationArea);
    console.log('Conversation area text: "' + conversationArea.textContent.substring(0, 200) + '..."');
    
    // 使用更精确的选择器，专门针对消息容器
    const messageSelectors = [
      // Gemini特定选择器
      'message-container',
      'conversation-turn',
      '[data-testid*="message"]',
      '[data-testid*="turn"]',
      '[data-message-type]',
      '[role*="message"]',
      // 通用消息选择器
      '.message',
      '.chat-message',
      '.conversation-turn',
      '[role="article"]',
      '.bubble',
      '.content',
      // 更通用的选择器
      'div > div', // 常见的消息容器结构
      '[class*="message"]',
      '[class*="content"]',
      '[class*="bubble"]'
    ];
    
    let foundMessages = false;
    for (const selector of messageSelectors) {
      const elements = conversationArea.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        if (elements.length > 0) {
          console.log(`First element for selector "${selector}":`, elements[0]);
          console.log(`First element text: "${elements[0].textContent.substring(0, 100)}..."`);
          console.log(`First element classes: "${elements[0].className}"`);
        }
        
        elements.forEach(element => {
          // 跳过噪音元素和会话历史
          if (isNoise(element) || isSessionHistoryElement(element)) {
            console.log(`Skipping element as noise/history: "${element.textContent.substring(0, 50)}..."`);
            return;
          }
          
          const content = extractCleanContent(element);
          if (content && content.text && content.text.length > 20) {
            console.log(`Found valid message: "${content.text.substring(0, 100)}..."`);
            console.log(`Element details: tag=${element.tagName}, classes=${element.className}, id=${element.id}`);
            // 根据元素特征和位置判断角色
            const role = determineMessageRole(element, content.text);
            console.log(`Determined role: ${role}`);
            result.push({ role, text: content.text, html: content.html });
            foundMessages = true;
          } else {
            console.log(`Skipping element - no valid content: "${element.textContent.substring(0, 50)}..."`);
            console.log(`Content details: text=${content?.text?.length}, html=${content?.html?.length}`);
          }
        });
        if (foundMessages) break;
      }
    }
    
    // 如果还是没找到，尝试更宽松的选择
    if (result.length === 0) {
      console.log('Trying loose selection as last resort');
      const allDivs = conversationArea.querySelectorAll('div, p, span');
      console.log(`Found ${allDivs.length} potential elements`);
      
      allDivs.forEach(element => {
        if (isNoise(element) || isSessionHistoryElement(element) || element.textContent.length < 30) {
          return;
        }
        
        const content = extractCleanContent(element);
        if (content && content.text && content.text.length > 30) {
          const role = determineMessageRole(element, content.text);
          result.push({ role, text: content.text, html: content.html });
        }
      });
    }
    
    console.log(`Fallback parsing found ${result.length} messages`);
    
    // 如果还是没找到消息，尝试基于内容模式的最终方法
    if (result.length === 0) {
      console.log('Trying content-based pattern matching as last resort');
      const contentBasedResult = parseByContentPatterns(container);
      result.push(...contentBasedResult);
      console.log(`Content-based parsing found ${contentBasedResult.length} messages`);
    }
    
    return result;
  }

  // 查找主要对话区域，排除侧边栏等
  function findMainConversationArea() {
    // 首先尝试找到明确的对话容器
    const containers = [
      'chat-window',
      '[role="main"]',
      'main',
      '.conversation-container',
      '.chat-container',
      '.messages-container'
    ];
    
    for (const selector of containers) {
      const container = document.querySelector(selector);
      if (container && container.textContent.length > 100) {
        // 确保这不是侧边栏或历史列表
        const rect = container.getBoundingClientRect();
        if (rect.width > 400 && rect.height > 300) {
          return container;
        }
      }
    }
    
    // 如果找不到明确的容器，查找最大的内容区域
    const allDivs = document.querySelectorAll('div');
    let largestArea = null;
    let maxSize = 0;
    
    allDivs.forEach(div => {
      const rect = div.getBoundingClientRect();
      const area = rect.width * rect.height;
      
      // 跳过太小或明显是侧边栏的元素
      if (area < 100000 || rect.width < 400 || rect.left < 100) return;
      
      // 跳过包含会话历史的容器
      if (isSessionHistoryContainer(div)) return;
      
      if (area > maxSize && div.textContent.length > 200) {
        maxSize = area;
        largestArea = div;
      }
    });
    
    return largestArea;
  }

  // 检查是否是会话历史相关的元素
  function isSessionHistoryElement(element) {
    const text = element.textContent || '';
    const className = element.className || '';
    const id = element.id || '';
    
    // 检查类名和ID
    const historyPatterns = [
      'history', 'sidebar', 'nav', 'menu', 'list', 'recent',
      '历史', '侧边', '菜单', '列表', '最近'
    ];
    
    for (const pattern of historyPatterns) {
      if (className.toLowerCase().includes(pattern) || 
          id.toLowerCase().includes(pattern)) {
        return true;
      }
    }
    
    // 检查是否在侧边栏区域
    const rect = element.getBoundingClientRect();
    if (rect.left < 300 && rect.width < 400) {
      return true; // 可能是左侧边栏
    }
    
    // 检查文本特征 - 会话历史通常是简短的标题列表
    if (text.length < 100 && (
      text.includes('新对话') || 
      text.includes('New chat') ||
      text.includes('昨天') ||
      text.includes('Yesterday') ||
      /\d+天前/.test(text) ||
      /\d+ days ago/.test(text)
    )) {
      return true;
    }
    
    return false;
  }

  // 检查是否是会话历史容器
  function isSessionHistoryContainer(element) {
    const children = element.children;
    if (children.length < 3) return false;
    
    // 如果包含多个相似的短文本元素，可能是历史列表
    let shortTextCount = 0;
    for (let i = 0; i < Math.min(children.length, 10); i++) {
      const child = children[i];
      const text = child.textContent || '';
      if (text.length > 10 && text.length < 100) {
        shortTextCount++;
      }
    }
    
    return shortTextCount >= 3;
  }

  // 根据元素特征确定消息角色
  function determineMessageRole(element, text) {
    const className = element.className.toLowerCase();
    const textLower = text.toLowerCase();
    
    console.log(`Determining role for element: class=${className}, text="${text.substring(0, 50)}..."`);  
    console.log(`Element tag: ${element.tagName}, id: ${element.id}`);
    
    // 检查明确的角色标识
    if (className.includes('user') || className.includes('human') || 
        element.matches('[data-role*="user"], [class*="user"]')) {
      console.log('Role determined: user (by class name)');
      return 'user';
    }
    
    if (className.includes('model') || className.includes('assistant') || 
        element.matches('[data-role*="model"], [class*="assistant"]')) {
      console.log('Role determined: assistant (by class name)');
      return 'assistant';
    }
    
    // 检查数据属性
    if (element.hasAttribute('data-message-type')) {
      const messageType = element.getAttribute('data-message-type');
      console.log(`Found data-message-type: ${messageType}`);
      if (messageType === 'USER' || messageType === 'user') {
        console.log('Role determined: user (by data-message-type)');
        return 'user';
      }
      if (messageType === 'MODEL' || messageType === 'model') {
        console.log('Role determined: assistant (by data-message-type)');
        return 'assistant';
      }
    }
    
    // 检查其他数据属性
    const dataAttrs = ['data-role', 'data-author', 'data-type', 'data-message-author'];
    for (const attr of dataAttrs) {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        console.log(`Found ${attr}: ${value}`);
        if (value && (value.toLowerCase().includes('user') || value.toLowerCase().includes('human'))) {
          console.log('Role determined: user (by ${attr})');
          return 'user';
        }
        if (value && (value.toLowerCase().includes('model') || value.toLowerCase().includes('assistant'))) {
          console.log('Role determined: assistant (by ${attr})');
          return 'assistant';
        }
      }
    }
    
    // 根据文本特征判断
    if ((textLower.includes('?') && text.length < 200) || 
        textLower.includes('你好') || textLower.includes('请问') || 
        textLower.includes('how') || textLower.includes('what') || textLower.includes('why') ||
        textLower.includes('can you') || textLower.includes('could you')) {
      console.log('Role determined: user (by text pattern)');
      return 'user'; // 短问题通常是用户输入
    }
    
    if (text.length > 300 || textLower.includes('根据') || textLower.includes('based on') ||
        textLower.includes('建议') || textLower.includes('recommend') ||
        textLower.includes('总结') || textLower.includes('summary') ||
        textLower.includes('i think') || textLower.includes('in my opinion')) {
      console.log('Role determined: assistant (by text pattern)');
      return 'assistant'; // 长回答通常是助手回复
    }
    
    // 根据DOM位置判断 - 尝试找到用户消息的模式
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const elementIndex = siblings.indexOf(element);
      
      // 如果是第一个消息或者前一个消息是助手，则可能是用户
      if (elementIndex === 0 || 
          (elementIndex > 0 && siblings[elementIndex - 1].textContent.length > 200)) {
        console.log('Role determined: user (by DOM position)');
        return 'user';
      }
    }
    
    console.log('Role determined: assistant (default)');
    return 'assistant'; // 默认为助手
  }

  // 基于内容模式的消息解析（最终备用方法）
  function parseByContentPatterns(container) {
    const result = [];
    console.log('Starting content-based pattern matching');
    
    // 查找所有可能包含对话内容的元素
    const potentialElements = container.querySelectorAll('div, p, span, section, article');
    console.log(`Found ${potentialElements.length} potential elements for pattern matching`);
    
    potentialElements.forEach((element, index) => {
      const text = (element.textContent || '').trim();
      
      // 跳过噪音元素
      if (isNoise(element) || isSessionHistoryElement(element) || text.length < 10) {
        return;
      }
      
      // 简单的基于长度和内容的角色判断
      let role = 'assistant'; // 默认为助手
      
      // 用户消息特征：较短，包含问号或请求词语
      if (text.length <= 300 && 
          (text.includes('?') || text.includes('？') || 
           text.includes('你好') || text.includes('请问') ||
           text.toLowerCase().includes('how') || text.toLowerCase().includes('what') ||
           text.toLowerCase().includes('can you') || text.toLowerCase().includes('could you'))) {
        role = 'user';
        console.log(`Pattern match: user - "${text.substring(0, 50)}..."`);
      }
      // 助手消息特征：较长，包含解释性词语
      else if (text.length > 200 && 
               (text.includes('根据') || text.includes('建议') || text.includes('总结') ||
                text.toLowerCase().includes('based on') || text.toLowerCase().includes('recommend') ||
                text.toLowerCase().includes('i think') || text.toLowerCase().includes('in my opinion'))) {
        role = 'assistant';
        console.log(`Pattern match: assistant - "${text.substring(0, 50)}..."`);
      }
      
      const content = extractCleanContent(element);
      if (content && content.text) {
        result.push({ 
          role: role, 
          text: content.text, 
          html: content.html 
        });
      }
    });
    
    return result;
  }

  // 去重和最终过滤
  function deduplicateAndFilter(messages) {
    const seen = new Set();
    const filtered = [];
    
    console.log(`Deduplication input: ${messages.length} messages`);
    
    messages.forEach((msg, index) => {
      // 创建内容指纹用于去重
      const fingerprint = msg.text.substring(0, 100).replace(/\s+/g, ' ').trim();
      
      if (!seen.has(fingerprint) && msg.text.length > 10) {
        seen.add(fingerprint);
        filtered.push(msg);
        console.log(`   Keeping message ${index} (${msg.role}): "${fingerprint}..."`);
      } else {
        console.log(`   Filtering out message ${index} (${msg.role}): "${fingerprint}..." - ${seen.has(fingerprint) ? 'duplicate' : 'too short'}`);
      }
    });
    
    console.log(`Deduplication output: ${filtered.length} messages`);
    return filtered;
  }

  function extractCleanContent(element) {
    const clone = element.cloneNode(true);
    
    // 移除不需要的元素
    const elementsToRemove = clone.querySelectorAll(
      'button, svg, img, .copy, .edit, .icon, [class*="icon"], [class*="button"], input, textarea'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // 保留代码块的HTML结构
    const codeBlocks = clone.querySelectorAll('pre, code');
    codeBlocks.forEach(codeBlock => {
      // 确保代码块有合适的样式
      codeBlock.style.whiteSpace = 'pre-wrap';
      codeBlock.style.wordWrap = 'break-word';
      codeBlock.style.backgroundColor = '#f5f5f5';
      codeBlock.style.padding = '8px';
      codeBlock.style.borderRadius = '4px';
      codeBlock.style.overflow = 'auto';
    });
    
    const text = clone.textContent.trim();
    const html = clone.innerHTML;
    
    return {
      text: text.length > 0 ? text : null,
      html: html.length > 0 ? html : null
    };
  }

  function isNoise(element) {
    const text = (element.textContent || '').trim();
    const className = element.className || '';
    const id = element.id || '';
    
    // 过滤输入框和相关UI
    if (element.matches('textarea, input, button, [contenteditable="true"], svg, img')) {
      return true;
    }
    
    // 过滤明确的UI元素类名和ID
    const uiPatterns = [
      'toolbar', 'header', 'footer', 'nav', 'menu', 'sidebar', 'btn', 'button',
      'icon', 'avatar', 'profile', 'settings', 'controls', 'actions',
      'tooltip', 'dropdown', 'modal', 'popup', 'overlay',
      '工具', '按钮', '菜单', '设置', '控制'
    ];
    
    for (const pattern of uiPatterns) {
      if (className.toLowerCase().includes(pattern) || 
          id.toLowerCase().includes(pattern)) {
        return true;
      }
    }
    
    // 过滤常见的UI文本
    const uiTexts = [
      '发送', 'Send', '清空', 'Clear', '复制', 'Copy', '编辑', 'Edit',
      '重新生成', 'Regenerate', '点赞', 'Like', '点踩', 'Dislike',
      '分享', 'Share', '保存', 'Save', '删除', 'Delete', 'Export',
      '新对话', 'New chat', '历史记录', 'History', '设置', 'Settings',
      '登录', 'Login', '注册', 'Sign up', '退出', 'Logout',
      '更多', 'More', '选项', 'Options', '帮助', 'Help'
    ];
    if (uiTexts.some(uiText => text === uiText || text.toLowerCase() === uiText.toLowerCase())) {
      return true;
    }
    
    // 过滤空或很短的内容
    if (!text || text.length < 10) {
      return true;
    }
    
    // 过滤纯符号或数字的内容
    if (/^[\d\s\-_.,!@#$%^&*()+=\[\]{}|;':"<>?/~`]+$/.test(text)) {
      return true;
    }
    
    // 过滤时间戳格式的文本
    if (/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?$/i.test(text) || 
        /^\d{4}-\d{2}-\d{2}/.test(text)) {
      return true;
    }
    
    // 检查是否是会话历史元素
    if (isSessionHistoryElement(element)) {
      return true;
    }
    
    return false;
  }

  function buildTitle(chat) {
    let t = (document.title || '').trim();
    
    // 移除Gemini相关后缀
    t = t.replace(/\s*[-|–]\s*Gemini.*$/i, '')
         .replace(/\s*[-|–]\s*Google.*$/i, '')
         .replace(/\s*\|\s*Gemini.*$/i, '')
         .trim();

    // 过滤无效标题
    if (!t || /^(gemini|new chat|新的对话)$/i.test(t)) {
      const firstUser = (chat.find(m => String(m.role).toLowerCase() === 'user') || {}).text || '';
      t = firstUser ? firstUser.trim().slice(0, 40) : '会话';
    }

    return `${t} - Gemini`;
  }

  function exportChat() {
    console.log('exportChat function called');
    const chat = parseChat();
    
    // 详细的调试输出
    console.log('Parsed chat result:', chat);
    console.log('Number of messages found:', chat.length);
    
    // 统计用户和助手消息数量
    const userMessages = chat.filter(msg => msg.role === 'user');
    const assistantMessages = chat.filter(msg => msg.role === 'assistant');
    console.log('User messages:', userMessages.length);
    console.log('Assistant messages:', assistantMessages.length);
    
    // 输出前几个消息的摘要
    chat.slice(0, 10).forEach((msg, index) => {
      console.log(`Message ${index} (${msg.role}): "${msg.text.substring(0, 100)}..."`);
      console.log(`Message ${index} HTML length: ${msg.html ? msg.html.length : 'null'}`);
    });
    
    // 检查消息顺序模式
    if (chat.length > 0) {
      console.log('Message sequence pattern:');
      const sequence = chat.map(msg => msg.role.charAt(0).toUpperCase()).join('-');
      console.log(`Sequence: ${sequence}`);
      
      // 检查是否有连续的同类型消息
      for (let i = 0; i < chat.length - 1; i++) {
        if (chat[i].role === chat[i + 1].role) {
          console.log(`Warning: Consecutive ${chat[i].role} messages at positions ${i}-${i+1}`);
        }
      }
    }
    
    if (!chat.length) {
      console.log('No chat content found after parsing');
      // 添加额外的调试信息
      console.log('Document title:', document.title);
      console.log('URL:', window.location.href);
      console.log('Body content length:', document.body.textContent.length);
      
      // 尝试手动检查页面结构
      console.log('Checking for common Gemini elements...');
      const commonSelectors = [
        'chat-window',
        '[role="main"]',
        'main',
        '.conversation-container',
        '.chat-container',
        '.messages-container',
        '[data-message-type]',
        '[data-role]',
        '.message',
        '.chat-message'
      ];
      
      commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          elements.forEach((el, idx) => {
            console.log(`Element ${idx}: tag=${el.tagName}, classes=${el.className}, text="${el.textContent.substring(0, 50)}..."`);
          });
        }
      });
      
      return false;
    }
    console.log('Successfully parsed chat content with', chat.length, 'messages');
    const title = buildTitle(chat);
    
    // 转换为预览格式，优先使用HTML内容以保留代码块格式
    const messages = chat.map(msg => ({
      author: msg.role === 'user' ? 'User' : 'Gemini',
      content: msg.html && msg.html.trim().length > 0 ? msg.html : msg.text || ''
    }));
    
    // 发送到background script进行处理
    console.log('Sending gemini-content-ready message to background');
    
    // 使用改进的错误处理机制
    const sendMessage = () => {
      try {
        if (!chrome?.runtime?.id) {
          console.warn('Extension context invalidated, please refresh the page');
          return;
        }
        
        chrome.runtime.sendMessage({
          action: 'gemini-content-ready',
          data: { title, messages, url: window.location.href }
        }, (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            console.error('Failed to send Gemini content:', errorMsg);
            
            // 如果是端口关闭错误，不要重试，只记录
            if (errorMsg.includes('port closed') || errorMsg.includes('receiving end does not exist')) {
              console.log('Background script might be busy, message delivery attempted');
            }
          } else {
            console.log('Gemini content sent successfully:', response);
          }
        });
      } catch (error) {
        console.error('Extension context error:', error.message);
      }
    };
    
    // 延迟发送以确保background script准备就绪
    setTimeout(sendMessage, 100);
    
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
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // 检查扩展上下文是否仍然有效
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalidated during message handling');
        try { sendResponse({ success: false, message: 'Extension context invalidated, please refresh the page' }); } catch(_) {}
        return false;
      }
      
      if (request.action === 'ping') {
        sendResponse({ ready: true });
        return true; // 异步响应
      } else if (request.action === 'export') {
        try {
          const chat = parseChat();
          if (!chat || chat.length === 0) {
            sendResponse({ success: false, error: 'No conversation content found' });
            return false;
          }
          
          // 对于Gemini，我们启动导出流程但不等待完成
          // 实际的预览页面打开由background script通过gemini-content-ready消息处理
          const success = exportChat();
          
          // 立即返回成功，因为导出是异步进行的
          // background script会处理后续的预览页面打开
          sendResponse({ success: true, message: 'Gemini export started' });
          
        } catch (error) {
          console.error('Export error:', error);
          sendResponse({ success: false, error: error.message || 'Export operation failed' });
        }
        return false; // 同步响应
      } else if (request.action === 'export-gemini-content') {
        console.log('Received export-gemini-content request');
        try {
          const chat = parseChat();
          
          if (chat && chat.length > 0) {
            const title = buildTitle(chat);
            
            // 转换为预览格式，优先使用HTML内容以保留代码块格式
            const messages = chat.map(msg => ({
              author: msg.role === 'user' ? 'User' : 'Gemini',
              content: msg.html && msg.html.trim().length > 0 ? msg.html : msg.text || ''
            }));
            
            // Fast ACK to avoid port closed error in background retry loop
            try { sendResponse({ success: true, message: 'Export started' }); } catch(_) {}
            
            // Notify background to open preview
            setTimeout(() => {
              try {
                if (!chrome?.runtime?.id) {
                  console.warn('Extension context invalidated, please refresh the page');
                  return;
                }
                
                chrome.runtime.sendMessage({ 
                  action: 'gemini-content-ready', 
                  data: { title, messages, url: window.location.href } 
                }, (response) => {
                  if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    console.error('Failed to send Gemini content:', errorMsg);
                    
                    // 如果是端口关闭错误，不要重试，只记录
                    if (errorMsg.includes('port closed') || errorMsg.includes('receiving end does not exist')) {
                      console.log('Background script might be busy, message delivery attempted');
                    }
                  } else {
                    console.log('Gemini content sent successfully:', response);
                  }
                });
              } catch (error) {
                console.error('Extension context error:', error.message);
              }
            }, 100);
          } else {
            const err = 'No conversation content found';
            try { sendResponse({ success: false, message: err }); } catch(_) {}
            try {
              if (chrome.runtime?.id) {
                chrome.runtime.sendMessage({ action: 'gemini-content-failed', error: err }, (response) => {
                  if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    console.error('Failed to send Gemini content failed message:', errorMsg);
                    
                    // 如果是端口关闭错误，不要重试，只记录
                    if (errorMsg.includes('port closed') || errorMsg.includes('receiving end does not exist')) {
                      console.log('Background script might be busy, failure message delivery attempted');
                    }
                  } else {
                    console.log('Gemini content failed message sent successfully:', response);
                  }
                });
              }
            } catch (error) {
              console.error('Extension context error:', error.message);
            }
          }
        } catch (error) {
          const errMsg = error?.message || String(error);
          try { sendResponse({ success: false, message: errMsg }); } catch(_) {}
          try {
            if (chrome.runtime?.id) {
              chrome.runtime.sendMessage({ action: 'gemini-content-failed', error: errMsg }, (response) => {
                if (chrome.runtime.lastError) {
                  const errorMsg = chrome.runtime.lastError.message;
                  console.error('Failed to send Gemini content failed message:', errorMsg);
                  
                  // 如果是端口关闭错误，不要重试，只记录
                  if (errorMsg.includes('port closed') || errorMsg.includes('receiving end does not exist')) {
                    console.log('Background script might be busy, error message delivery attempted');
                  }
                } else {
                  console.log('Gemini content error message sent successfully:', response);
                }
              });
            }
          } catch (error) {
            console.error('Extension context error:', error.message);
          }
        }
        return true; // 异步响应
      }
      return true; // ensure listener treated as async
    });
  }

  // 注入样式以优化代码块显示
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      pre, code {
        background: #f5f5f5 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
        overflow-wrap: break-word !important;
        padding: 8px !important;
        border-radius: 4px !important;
        overflow: auto !important;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      
      pre {
        border: 1px solid #ddd !important;
        margin: 8px 0 !important;
      }
      
      code {
        border: 1px solid #eee !important;
        margin: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 页面加载完成后注入样式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
})();