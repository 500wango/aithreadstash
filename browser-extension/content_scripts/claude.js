/**
 * Claude会话导出内容脚本
 * 
 * 该脚本负责从Claude网站提取对话内容，包括文本和代码块，
 * 并将其发送到background script进行进一步处理。
 */



// ==================== 工具函数 ====================

/**
 * 等待页面完全加载
 */
function waitForPageLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', () => {
                resolve();
            });
            // Fallback timeout
            setTimeout(() => {
                resolve();
            }, 2000);
        }
    });
}

// ==================== 消息提取核心逻辑 ====================

/**
 * 主要的消息提取函数
 * 尝试多种方法来提取Claude对话内容
 */
function extractClaudeMessages() {
    
    try {
        // 首先尝试专门针对Claude的提取方法
        const claudeResult = extractClaudeConversation();
        if (claudeResult && claudeResult.messages && claudeResult.messages.length > 0) {
            console.log(`[AI-ThreadStash] Successfully extracted ${claudeResult.messages.length} messages using Claude-specific method`);
            return claudeResult;
        }
        
        // 如果专门方法失败，尝试通用方法
        console.log('[AI-ThreadStash] Claude-specific method failed, trying generic methods');
        const methods = [
            extractByDataAttributes,
            extractByClassNames,
            extractByStructure,
            extractByFallback
        ];
        
        for (const method of methods) {
            try {
                const result = method();
                if (result && result.messages && result.messages.length > 0) {
                    console.log(`[AI-ThreadStash] Successfully extracted ${result.messages.length} messages using ${method.name}`);
                    return result;
                }
            } catch (error) {
                console.warn(`[AI-ThreadStash] Method ${method.name} failed:`, error);
            }
        }
    } catch (error) {
        console.error('[AI-ThreadStash] Error in extractClaudeMessages:', error);
    }
    
    return { error: 'Failed to extract messages using all methods' };
}

/**
 * 专门针对Claude网站的提取方法
 * 基于Claude的实际DOM结构进行消息提取
 */
function extractClaudeConversation() {
    console.log('[AI-ThreadStash] Trying Claude-specific extraction method based on actual DOM structure');
    
    // 查找对话容器
    const conversationSelectors = [
        'div.h-screen.flex.flex-col.overflow-hidden',
        'main',
        '[role="main"]',
        '[class*="conversation"]'
    ];
    
    let container = null;
    for (const selector of conversationSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            container = elements[0];
            console.log(`[AI-ThreadStash] Found conversation container with selector: ${selector}`);
            break;
        }
    }
    
    if (!container) {
        container = document.body;
        console.log('[AI-ThreadStash] Using document.body as fallback container');
    }
    
    // 提取消息
    const messages = [];
    
    // 方法1: 查找Claude回复消息
    const claudeMessages = container.querySelectorAll('div.font-claude-response');
    console.log(`[AI-ThreadStash] Found ${claudeMessages.length} Claude messages`);
    
    claudeMessages.forEach(element => {
        const content = cleanMessageContent(element);
        if (content && (content.text || content.html)) {
            messages.push({
                author: 'Claude',
                content: content,
                element: element,
                type: 'claude-response'
            });
        }
    });
    
    // 方法2: 查找用户消息
    const userMessages = container.querySelectorAll('p.whitespace-pre-wrap.break-words');
    console.log(`[AI-ThreadStash] Found ${userMessages.length} user messages`);
    
    userMessages.forEach(element => {
        const content = cleanMessageContent(element);
        if (content && (content.text || content.html)) {
            messages.push({
                author: 'User',
                content: content,
                element: element,
                type: 'user-input'
            });
        }
    });
    
    // 方法3: 查找其他可能的消息元素
    const otherMessages = container.querySelectorAll(
        'div[class*="message"], div[class*="Message"], div[class*="chat"], div[class*="conversation"]'
    );
    
    otherMessages.forEach(element => {
        const text = element.textContent.trim();
        if (text.length > 10 && text.length < 50000) {
            // 检查是否已经添加过这个元素
            const alreadyAdded = messages.some(msg => msg.element === element);
            if (!alreadyAdded) {
                const author = detectAuthor(element, text);
                const content = cleanMessageContent(element);
                if (content.length > 0) {
                    messages.push({
                        author: author,
                        content: content,
                        element: element,
                        type: 'other'
                    });
                }
            }
        }
    });
    
    // 如果没有找到足够的消息，尝试更通用的方法
    if (messages.length < 2) {
        console.log('[AI-ThreadStash] Not enough messages found, trying generic approach');
        const genericMessages = extractGenericConversation(container);
        if (genericMessages && genericMessages.length > messages.length) {
            return {
                title: document.title || 'Claude Conversation',
                messages: genericMessages,
                source: 'claude-generic'
            };
        }
    }
    
    if (messages.length === 0) {
        console.log('[AI-ThreadStash] No messages found in conversation');
        return null;
    }
    
    // 按DOM位置排序消息
    messages.sort((a, b) => {
        const position = a.element.compareDocumentPosition(b.element);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    // 转换为最终格式并清理
    const finalMessages = messages.map(msg => {
        const {element, type, ...cleanMsg} = msg;
        return cleanMsg;
    });
    
    return {
        title: document.title || 'Claude Conversation',
        messages: finalMessages,
        source: 'claude-specific'
    };
}

/**
 * 通用对话提取方法
 */
function extractGenericConversation(container) {
    console.log('[AI-ThreadStash] Trying generic conversation extraction');
    
    // 查找所有可能包含文本的元素
    const textElements = Array.from(container.querySelectorAll('div, p, span, article'));
    const messages = [];
    
    for (const element of textElements) {
        const text = element.textContent.trim();
        // 过滤条件
        if (text.length < 20 || text.length > 50000) continue;
        if (element.closest('button, nav, header, footer, aside, form, input, textarea, script, style')) continue;
        if (element.children.length > 30) continue; // 避免过于复杂的容器
        
        // 检查是否是消息块
        const hasParagraphStructure = text.includes('.') || text.includes('。') || text.includes('\n');
        const isNotUIElement = !element.className.includes('button') && 
                              !element.className.includes('toolbar') && 
                              !element.className.includes('meta');
        
        if (hasParagraphStructure && isNotUIElement) {
            const author = detectAuthor(element, text);
            const content = cleanMessageContent(element);
            if (content.length > 0) {
                messages.push({ author, content, element });
            }
        }
    }
    
    console.log(`[AI-ThreadStash] Found ${messages.length} messages using generic approach`);
    
    // 按DOM位置排序
    messages.sort((a, b) => {
        const position = a.element.compareDocumentPosition(b.element);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    // 清理并返回
    return messages.map(msg => {
        const {element, ...cleanMsg} = msg;
        return cleanMsg;
    });
}

/**
 * 通过data属性提取消息
 */
function extractByDataAttributes() {
    console.log('[AI-ThreadStash] Trying data attributes method');
    
    // 查找具有特定data属性的消息元素
    const messageElements = document.querySelectorAll('[data-testid*="message"], [data-message-id], [data-claude-message]');
    console.log(`[AI-ThreadStash] Found ${messageElements.length} elements with data attributes`);
    
    if (messageElements.length === 0) return null;
    
    const messages = Array.from(messageElements).map((el, index) => {
        // 尝试确定作者
        let author = 'Unknown';
        const text = el.textContent.trim();
        
        // 查找作者指示器
        const authorElements = el.querySelectorAll('[data-testid*="author"], [class*="author"], [class*="sender"]');
        if (authorElements.length > 0) {
            const authorText = authorElements[0].textContent.trim();
            author = authorText.includes('Claude') || authorText.includes('Assistant') ? 'Claude' : 'User';
        } else {
            // 基于Claude网站的典型结构判断作者
            const elementHtml = el.outerHTML;
            const parentHtml = el.parentElement ? el.parentElement.outerHTML : '';
            
            // 检查是否有Claude特定的标识
            const isClaudeMessage = elementHtml.includes('claude') || 
                                  elementHtml.includes('assistant') || 
                                  elementHtml.includes('AI') ||
                                  parentHtml.includes('claude') || 
                                  parentHtml.includes('assistant');
            
            // 基于内容特征判断作者
            const hasClaudeIndicators = text.includes('Claude') || text.includes('AI') || 
                                      text.includes('助手') || text.includes('Assistant');
            
            // 基于位置的简单启发式方法
            const isEvenIndex = index % 2 === 0;
            
            // 综合判断
            if (isClaudeMessage || hasClaudeIndicators || isEvenIndex) {
                author = 'Claude';
            } else {
                author = 'User';
            }
        }
        
        // 如果仍然未知，使用交替模式
        if (author === 'Unknown') {
            author = index % 2 === 0 ? 'Claude' : 'User';
        }
        
        return { author, content: text, element: el };
    });
    
    return {
        title: document.title,
        messages: messages.filter(msg => msg.content.length > 0),
        source: 'data-attributes'
    };
}

/**
 * 通过类名提取消息
 */
function extractByClassNames() {
    console.log('[AI-ThreadStash] Trying class names method');
    
    // 查找具有特定类名的消息元素
    const selectors = [
        '[class*="message"]',
        '[class*="Message"]',
        '[class*="claude"]',
        '[class*="Claude"]',
        '[class*="chat"]',
        '[class*="Chat"]',
        '[class*="conversation"]',
        '[class*="Conversation"]',
        '[class*="font-claude"]',
        '[class*="response"]',
        '[class*="input"]',
        'p.whitespace-pre-wrap.break-words' // 用户提供的具体结构
    ];
    
    let messageElements = [];
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`[AI-ThreadStash] Selector "${selector}" found ${elements.length} elements`);
        if (elements.length > 0) {
            messageElements = Array.from(elements);
            break;
        }
    }
    
    if (messageElements.length === 0) return null;
    
    // 过滤出可能的消息元素
    const filteredElements = messageElements.filter(el => {
        const text = el.textContent.trim();
        return text.length > 10 && text.length < 20000 && 
               !el.closest('button, nav, header, footer, aside');
    });
    
    console.log(`[AI-ThreadStash] Filtered to ${filteredElements.length} potential message elements`);
    
    const messages = filteredElements.map((el, index) => {
        // 尝试确定作者
        let author = 'Unknown';
        const text = el.textContent.trim();
        
        // 查找作者指示器
        const authorElements = el.querySelectorAll('[class*="author"], [class*="sender"]');
        if (authorElements.length > 0) {
            const authorText = authorElements[0].textContent.trim();
            author = authorText.includes('Claude') || authorText.includes('Assistant') ? 'Claude' : 'User';
        } else {
            // 基于类名判断作者
            const className = el.className || '';
            if (className.includes('claude-response') || 
                className.includes('font-claude') || 
                className.includes('assistant')) {
                author = 'Claude';
            } else if (className.includes('user-input') || 
                      className.includes('user') || 
                      className.includes('human') ||
                      className === 'whitespace-pre-wrap break-words') { // 用户提供的具体类名
                author = 'User';
            } else {
                // 基于内容和位置判断
                const hasClaudeIndicators = text.includes('Claude') || text.includes('AI') || 
                                          text.includes('助手') || text.includes('Assistant');
                const isEvenIndex = index % 2 === 0;
                
                if (hasClaudeIndicators || isEvenIndex) {
                    author = 'Claude';
                } else {
                    author = 'User';
                }
            }
        }
        
        // 如果仍然未知，使用交替模式
        if (author === 'Unknown') {
            author = index % 2 === 0 ? 'Claude' : 'User';
        }
        
        // 提取干净的内容
        const cleanContent = cleanMessageContent(el);
        
        return { author, content: cleanContent, element: el };
    });
    
    return {
        title: document.title,
        messages: messages.filter(msg => msg.content.length > 0),
        source: 'class-names'
    };
}

/**
 * 通过结构分析提取消息
 */
function extractByStructure() {
    console.log('[AI-ThreadStash] Trying structure analysis method');
    
    // 查找可能包含对话的容器
    const containerSelectors = [
        'main',
        '[role="main"]',
        '[class*="main"]',
        '[class*="chat"]',
        '[class*="conversation"]',
        'div.h-screen.flex.flex-col.overflow-hidden'
    ];
    
    let container = null;
    for (const selector of containerSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            container = elements[0];
            console.log(`[AI-ThreadStash] Found container with selector: ${selector}`);
            break;
        }
    }
    
    if (!container) {
        container = document.body;
        console.log('[AI-ThreadStash] Using document.body as container');
    }
    
    // 在容器中查找文本块
    const textBlocks = [];
    const allElements = container.querySelectorAll('*');
    
    for (const element of allElements) {
        const text = element.textContent.trim();
        if (text.length > 20 && text.length < 10000 && 
            !element.closest('button, nav, header, footer, aside, script, style') &&
            element.children.length < 10) {
            
            textBlocks.push({
                element: element,
                text: text,
                length: text.length
            });
        }
    }
    
    console.log(`[AI-ThreadStash] Found ${textBlocks.length} text blocks`);
    
    // 对文本块进行排序
    textBlocks.sort((a, b) => {
        const position = a.element.compareDocumentPosition(b.element);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    const messages = textBlocks.map((block, index) => {
        // 智能作者识别
        let author = 'Unknown';
        const text = block.text;
        
        const elementHtml = block.element.outerHTML;
        const parentHtml = block.element.parentElement ? block.element.parentElement.outerHTML : '';
        
        // 检查Claude特定标识
        const isClaudeMessage = elementHtml.includes('claude-response') || 
                              elementHtml.includes('font-claude') || 
                              elementHtml.includes('assistant') ||
                              parentHtml.includes('claude') || 
                              parentHtml.includes('assistant');
        
        // 基于内容特征判断
        const hasClaudeIndicators = text.includes('Claude') || text.includes('AI') || 
                                  text.includes('助手') || text.includes('Assistant');
        
        // 基于位置判断
        const isEvenIndex = index % 2 === 0;
        
        // 综合判断
        if (isClaudeMessage || hasClaudeIndicators || isEvenIndex) {
            author = 'Claude';
        } else {
            author = 'User';
        }
        
        // 如果仍然未知，使用交替模式
        if (author === 'Unknown') {
            author = index % 2 === 0 ? 'Claude' : 'User';
        }
        
        return { author, content: block.text, element: block.element };
    });
    
    return {
        title: document.title,
        messages: messages.filter(msg => msg.content.length > 0),
        source: 'structure-analysis'
    };
}

/**
 * 通过fallback方法提取消息
 */
function extractByFallback() {
    console.log('[AI-ThreadStash] Trying fallback method');
    
    // 查找所有包含大量文本的div和p元素
    const allDivs = Array.from(document.querySelectorAll('div, p'));
    const textElements = allDivs.filter(element => {
        const text = element.textContent.trim();
        return text.length > 30 && text.length < 20000 &&
               !element.closest('button, nav, header, footer, aside, script, style, form, input, textarea');
    });
    
    console.log(`[AI-ThreadStash] Found ${textElements.length} text elements`);
    
    if (textElements.length === 0) return null;
    
    // 排序元素
    textElements.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    const messages = textElements.map((element, index) => {
        // 智能作者识别
        let author = 'Unknown';
        const text = element.textContent.trim();
        
        const className = element.className || '';
        const elementHtml = element.outerHTML;
        
        // 检查特定类名
        if (className.includes('claude-response') || 
            className.includes('font-claude') || 
            className.includes('assistant')) {
            author = 'Claude';
        } else if (className.includes('user-input') || 
                  className.includes('whitespace-pre-wrap')) { // 用户提供的类名
            author = 'User';
        } else {
            // 基于内容和位置判断
            const hasClaudeIndicators = text.includes('Claude') || text.includes('AI') || 
                                      text.includes('助手') || text.includes('Assistant');
            const isEvenIndex = index % 2 === 0;
            
            if (hasClaudeIndicators || isEvenIndex) {
                author = 'Claude';
            } else {
                author = 'User';
            }
        }
        
        // 如果仍然未知，使用交替模式
        if (author === 'Unknown') {
            author = index % 2 === 0 ? 'Claude' : 'User';
        }
        
        const content = cleanMessageContent(element);
        return { author, content, element: element };
    });
    
    return {
        title: document.title,
        messages: messages.filter(msg => msg.content.length > 0),
        source: 'fallback'
    };
}

// ==================== 作者识别和内容清理 ====================

/**
 * 检测消息作者
 */
function detectAuthor(element, text) {
    // 首先查找明确的作者标识
    const authorIndicators = element.querySelectorAll('[data-testid*="author"], [class*="author"], [class*="sender"]');
    if (authorIndicators.length > 0) {
        const authorText = authorIndicators[0].textContent.trim();
        if (authorText.includes('Claude') || authorText.includes('Assistant')) {
            return 'Claude';
        } else {
            return 'User';
        }
    }
    
    // 基于类名判断
    const className = element.className || '';
    if (className.includes('claude-response') || 
        className.includes('font-claude') || 
        className.includes('assistant') || 
        className.includes('AI')) {
        return 'Claude';
    }
    
    if (className.includes('user-input') || 
        className.includes('user') || 
        className.includes('human') || 
        className.includes('input')) {
        return 'User';
    }
    
    // 基于内容特征判断
    if (text.includes('Claude') || text.includes('AI') || text.includes('助手') || text.includes('Assistant')) {
        // 但如果文本较短，可能是用户在提到Claude
        if (text.length > 100) {
            return 'Claude';
        }
    }
    
    // 基于HTML属性判断
    const elementHtml = element.outerHTML;
    if (elementHtml.includes('claude-response') || elementHtml.includes('assistant')) {
        return 'Claude';
    }
    
    // 默认为用户消息（对话通常以用户开始）
    return 'User';
}

/**
 * 清理消息内容 - 采用简单有效的方法保留代码块
 */
function cleanMessageContent(element) {
    // 克隆元素以避免修改原始元素
    const clone = element.cloneNode(true);
    
    // 移除按钮、SVG、图片和其他不需要的UI元素
    const elementsToRemove = clone.querySelectorAll('button, svg, img, .copy, .edit, .icon, [class*="icon"], [class*="button"]');
    elementsToRemove.forEach(el => el.remove());
    
    const text = clone.textContent.trim();
    const html = clone.innerHTML;
    
    return {
        text: text,
        html: html
    };
}

// ==================== 主函数 ====================

/**
 * 主函数
 */
async function main() {
    try {
        // Wait for page to load
        await waitForPageLoad();
        
        // Additional wait to ensure dynamic content is loaded
        // 添加额外延迟以等待动态内容加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = extractClaudeMessages();
        
        if (result.error) {
            chrome.runtime.sendMessage({ action: 'claude-content-failed', error: result.error });
        } else if (result.messages && result.messages.length > 0) {
            
            // Convert to preview format with HTML support
            const messages = result.messages.map(msg => {
                const author = msg.author;
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
            }).filter(m => m.content && String(m.content).trim().length > 0);
            
            const title = result.title || 'Claude Conversation';
            const previewData = { title, messages };
            
            chrome.runtime.sendMessage({ action: 'claude-content-ready', data: previewData }, (response) => {
                // 静默处理响应
            });
        } else {
            const errorMessage = 'Scraped data but messages are empty.';
            chrome.runtime.sendMessage({ action: 'claude-content-failed', error: errorMessage });
        }

    } catch (error) {
        chrome.runtime.sendMessage({ action: 'claude-content-failed', error: error.message });
    }
}

// 添加消息监听器来响应background脚本的触发请求
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'ping') {
            sendResponse({ success: true, message: 'Claude content script ready' });
            return true;
        }
        
        if (request.action === 'export-claude-content') {
            // 重新运行主函数来提取内容
            main().then(() => {
                sendResponse({ success: true, message: 'Claude export completed' });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            
            return true; // 表示异步响应
        }
        
        return false;
    });
}

// 不要自动执行 main 函数，而是等待消息触发
// main();