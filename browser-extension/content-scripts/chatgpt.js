// AI ThreadStash content script loaded on ChatGPT page

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'ping') {
        sendResponse({ready: true});
        return true;
    }
    
    if (request.action === 'export') {
        try {
            const conversationData = parseConversation();
            
            if (!conversationData || conversationData.turns.length === 0) {
                sendResponse({success: false, error: '未找到对话内容'});
                return true;
            }
            
            chrome.runtime.sendMessage({
                action: 'openPreview',
                data: conversationData
            }, (response) => {
                if (chrome.runtime.lastError) {
                    // Background communication error
                    sendResponse({success: false, error: '通信失败: ' + chrome.runtime.lastError.message});
                } else if (response && response.success) {
                    sendResponse({success: true});
                } else {
                    const errorMsg = response ? response.error : '处理失败';
                    sendResponse({success: false, error: errorMsg});
                }
            });
        } catch (error) {
            // AI ThreadStash parsing error
            sendResponse({success: false, error: error.message});
        }
        return true;
    }
});

function parseConversation() {
    const title = getConversationTitle();
    const turns = [];
    
    const messageElements = document.querySelectorAll('[data-message-author-role]');
    
    messageElements.forEach((element, index) => {
        const role = element.getAttribute('data-message-author-role');
        const content = extractMessageContent(element);
        
        if (content && (role === 'user' || role === 'assistant')) {
            turns.push({
                role: role,
                content: content,
                timestamp: new Date().toISOString(),
                index: index
            });
        }
    });
    
    return {
        title: title,
        url: window.location.href,
        exportedAt: new Date().toISOString(),
        turns: turns
    };
}

function getConversationTitle() {
    const titleElement = document.querySelector('h1, .text-2xl, .text-3xl') || 
                         document.querySelector('title');
    
    if (titleElement) {
        const titleText = titleElement.textContent.trim();
        if (titleText && titleText !== 'ChatGPT') {
            // 如果标题中还没有包含ChatGPT标识，则添加
            if (!titleText.includes('ChatGPT')) {
                return titleText + ' - ChatGPT';
            }
            return titleText;
        }
    }
    
    return `ChatGPT Conversation - ${new Date().toLocaleString()}`;
}

function extractMessageContent(messageElement) {
    const contentContainer = messageElement.querySelector('[data-message-content]') || 
                            messageElement.querySelector('.markdown') ||
                            messageElement;
    
    if (!contentContainer) return null;
    
    // 检查是否包含思考过程内容，如果是则跳过
    if (containsThinkingProcess(contentContainer.textContent)) {
        return null;
    }
    
    // 创建一个克隆以进行清理
    const cleanContainer = contentContainer.cloneNode(true);

    // 只保护代码内容，不保护整个代码块容器
    const codeElements = cleanContainer.querySelectorAll('code');
    codeElements.forEach(code => {
        code.setAttribute('data-preserve', 'true');
        code.querySelectorAll('*').forEach(el => el.setAttribute('data-preserve', 'true'));
    });

    // 保护 pre 标签内的实际代码内容
    const preElements = cleanContainer.querySelectorAll('pre');
    preElements.forEach(pre => {
        const codeContent = pre.querySelector('code');
        if (codeContent) {
            codeContent.setAttribute('data-preserve', 'true');
            codeContent.querySelectorAll('*').forEach(el => el.setAttribute('data-preserve', 'true'));
        } else {
            // 如果 pre 内没有 code 标签，则保护 pre 的内容
            pre.setAttribute('data-preserve', 'true');
            pre.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const span = document.createElement('span');
                    span.setAttribute('data-preserve', 'true');
                    span.textContent = node.textContent;
                    node.parentNode.replaceChild(span, node);
                }
            });
        }
    });

    // 标记其他需要保护的代码块元素
    cleanContainer.querySelectorAll('[data-code-block]').forEach(block => {
        const codeContent = block.querySelector('code');
        if (codeContent) {
            codeContent.setAttribute('data-preserve', 'true');
            codeContent.querySelectorAll('*').forEach(el => el.setAttribute('data-preserve', 'true'));
        }
    });
    
    // 定义需要清理的元素选择器
    const selectors = [
        'button:not([data-preserve])',
        '[role="button"]:not([data-preserve])',
        '.flex:not([data-preserve])',
        '.absolute:not([data-preserve])',
        '[class*="toolbar"]:not([data-preserve])',
        '[class*="buttons"]:not([data-preserve])',
        '[class*="actions"]:not([data-preserve])',
        '[class*="download"]:not([data-preserve])',
        '[class*="share"]:not([data-preserve])',
        '[class*="loading"]:not([data-preserve])',
        '[class*="feedback"]:not([data-preserve])',
        '[class*="icon"]:not([data-preserve])',
        '[class*="menu"]:not([data-preserve])',
        '[class*="control"]:not([data-preserve])',
        // 特别处理代码块中的按钮
        '.markdown [class*="copy"]',
        '.markdown [class*="download"]',
        '.markdown [class*="action"]',
        '.markdown [class*="button"]',
        // 处理代码块工具栏
        '.markdown [class*="toolbar"]',
        '.markdown [class*="actions"]',
        // 处理代码块特定按钮
        'pre [class*="copy"]',
        'pre [class*="download"]',
        'pre [class*="action"]',
        'pre [class*="button"]',
        // 处理特定的代码块操作区域
        '[class*="code-block-header"]',
        '[class*="code-block-tools"]',
        '[class*="code-block-actions"]',
        '[class*="code-operations"]',
        '[class*="code-toolbar"]',
        // 处理其他可能的代码块相关元素
        '[class*="code-actions"]',
        '[class*="code-buttons"]',
        '[class*="code-controls"]',
        // ChatGPT 特有的代码块按钮和工具栏
        '[class*="flex-"] button',
        '[class*="flex-"] [role="button"]',
        '[class*="absolute-"] button',
        '[class*="absolute-"] [role="button"]',
        '[class*="relative-"] button',
        '[class*="relative-"] [role="button"]',
        // ChatGPT 特有的代码块操作区域
        '[class*="code-block-wrapper"]',
        '[class*="code-block-container"]',
        '[class*="code-block-content"]',
        '[class*="code-wrapper"]',
        '[class*="code-container"]',
        '[class*="code-content"]',
        // ChatGPT 特有的按钮类名
        '[class*="btn-copy"]',
        '[class*="btn-download"]',
        '[class*="btn-action"]',
        '[class*="btn-toolbar"]',
        '[class*="btn-control"]'
    ];

    // 移除按钮和工具栏，但保护代码内容
    cleanContainer.querySelectorAll(selectors.join(',')).forEach(el => {
        // 检查元素是否在受保护的代码内容中
        if (el.hasAttribute('data-preserve') || el.closest('[data-preserve]')) {
            return;
        }

        // 检查元素是否包含受保护的代码内容
        const hasPreservedContent = el.querySelector('[data-preserve]');
        if (hasPreservedContent) {
            return;
        }

        // 移除按钮和工具栏
        if (el.matches('button, [role="button"], [class*="toolbar"], [class*="buttons"], [class*="actions"]')) {
            el.remove();
            return;
        }

        // 检查其他元素是否包含重要内容
        const text = (el.textContent || '').trim();
        if (!text || text.length < 10) {
            el.remove();
        }
    });

    // 移除空的容器，但保留包含代码内容的容器
    cleanContainer.querySelectorAll('.flex, .absolute').forEach(container => {
        // 检查容器是否包含受保护的内容
        if (container.hasAttribute('data-preserve') || 
            container.closest('[data-preserve]') || 
            container.querySelector('[data-preserve]')) {
            return;
        }

        const text = (container.textContent || '').trim();
        if (!text || text.length < 10) {
            container.remove();
        }
    });

    // 清理临时标记
    cleanContainer.querySelectorAll('[data-preserve]').forEach(el => {
        el.removeAttribute('data-preserve');
    });
    
    const content = {
        text: cleanContainer.textContent.trim(),
        html: cleanContainer.innerHTML,
        markdown: convertToMarkdown(cleanContainer)
    };
    
    return content.text ? content : null;
}

function convertToMarkdown(element) {
    let markdown = element.textContent.trim();
    
    const codeBlocks = element.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        const language = detectCodeLanguage(block);
        const code = block.textContent;
        markdown = markdown.replace(code, `\n\`\`\`${language}\n${code}\n\`\`\`\n`);
    });
    
    const inlineCode = element.querySelectorAll('code:not(pre code)');
    inlineCode.forEach(code => {
        const codeText = code.textContent;
        markdown = markdown.replace(codeText, `\`${codeText}\``);
    });
    
    return markdown;
}

function detectCodeLanguage(codeElement) {
    const classList = codeElement.className.split(' ');
    const languageClass = classList.find(cls => cls.startsWith('language-') || cls.startsWith('lang-'));
    
    if (languageClass) {
        return languageClass.replace('language-', '').replace('lang-', '');
    }
    
    return 'text';
}

function containsThinkingProcess(text) {
    const thinkingIndicators = [
        '正在思考', '思考中', '分析中', '搜索中', '处理中', '计算中', '生成中',
        '已搜索到', '已深度思考', '互联网搜索', '深度思考', '联网搜索',
        '思考已停止', '停止思考', '思考完成', '思考结束', '思考暂停',
        '模型思考', '思考过程', '推理过程', '思维过程', '分析过程',
        '正在分析', '分析完成', '推理中', '推理完成',
        'thinking', 'analyzing', 'processing', 'reasoning',
        '让我想想', '让我分析', '让我思考', '我来分析',
        '思考：', '分析：', '推理：', '处理：',
        '正在搜索', '搜索完成', '网络搜索', 'web search', 'searching',
        '搜索结果', '搜索到', '查找中', '查询中', '检索中'
    ];
    return thinkingIndicators.some(indicator => text.includes(indicator));
}