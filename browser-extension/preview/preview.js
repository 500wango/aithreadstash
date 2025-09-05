class PreviewApp {
    constructor() {
        this.initI18n();
        this.initDOMElements();
        this.initEventListeners();
    }

    initI18n() {
        // Initialize internationalization for UI elements, but skip the title element
        const elementsWithI18n = document.querySelectorAll('[data-i18n]');
        elementsWithI18n.forEach(element => {
            const key = element.getAttribute('data-i18n');
            // Skip conversationTitle - it will be set by renderHeader with actual data
            if (key && i18n.t(key) && element.id !== 'conversationTitle') {
                element.textContent = i18n.t(key);
            }
        });
        
        // Update page title
        document.title = i18n.t('previewTitle');
        
        // Force update print button text to ensure it shows correctly
        const printBtnText = document.querySelector('#printContent .btn-text');
        if (printBtnText) {
            printBtnText.textContent = i18n.t('print');
        }
    }

    initDOMElements() {
        this.container = document.getElementById('conversationContent');
        this.titleElement = document.getElementById('conversationTitle');
        this.timeElement = document.getElementById('exportTime');
        this.sourceLink = document.getElementById('sourceLink');
        this.printBtn = document.getElementById('printContent');
        this.downloadMdBtn = document.getElementById('downloadMd');
        this.downloadJsonBtn = document.getElementById('downloadJson');
        this.copyRichTextBtn = document.getElementById('copyRichText');
        this.statusElement = document.getElementById('statusMessage');
        
        this.autoPrint = false;
        try {
            const params = new URLSearchParams(window.location.search);
            this.autoPrint = params.get('autoPrint') === '1';
        } catch (_) {}
    }
    
    initEventListeners() {
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => window.print());
        }
        if (this.downloadMdBtn) {
            this.downloadMdBtn.addEventListener('click', () => this.downloadMarkdown());
        }
        if (this.downloadJsonBtn) {
            this.downloadJsonBtn.addEventListener('click', () => this.downloadJson());
        }
        if (this.copyRichTextBtn) {
            this.copyRichTextBtn.addEventListener('click', () => this.copyToClipboard('richtext'));
        }
    }

    async loadConversationFromStorage() {
        const urlParams = new URLSearchParams(window.location.search);
        const dataKey = urlParams.get('key'); // Get the key from the URL
        const testMode = urlParams.get('test');
        
        // Test mode for development
        if (testMode === 'true') {
            try {
                this.showStatus('正在加载测试数据...', false);
                const response = await fetch('test-data.json');
                const data = await response.json();
                this.conversationData = data;
                this.renderHeader(this.conversationData.title, this.conversationData.exportedAt, this.conversationData.url);
                this.renderConversation(this.conversationData.turns);
                return;
            } catch (error) {
                this.showStatus('加载测试数据失败：' + error.message, true);
                this.container.innerHTML = '<div class="error"><strong>测试数据加载失败</strong><br>请确保test-data.json文件存在。</div>';
                return;
            }
        }

        if (dataKey) {
            // 增加重试机制和更好的错误处理
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 2000; // 2秒
            
            const attemptLoad = async () => {
                try {
                    console.log(`[AI-ThreadStash] Storage load attempt ${retryCount + 1}/${maxRetries + 1}`);
                    
                    // 检查扩展上下文是否有效
                    if (!chrome?.runtime?.id) {
                        throw new Error('扩展上下文无效，请刷新页面');
                    }
                    
                    const response = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({ action: 'getConversationData', key: dataKey }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                resolve(response);
                            }
                        });
                    });
                    
                    if (!response) {
                        throw new Error('未收到响应数据');
                    }
                    if (!response.success) {
                        throw new Error(response.error || '获取数据失败');
                    }
                    if (!response.data) {
                        throw new Error('数据为空');
                    }
                    if (!Array.isArray(response.data.turns)) {
                        throw new Error('对话数据格式错误');
                    }
                    
                    this.conversationData = response.data;
                    this.renderHeader(this.conversationData.title, this.conversationData.exportedAt, this.conversationData.url);
                    this.renderConversation(this.conversationData.turns);
                    console.log('[AI-ThreadStash] Storage load successful');
                    
                } catch (error) {
                    console.error(`[AI-ThreadStash] Storage load attempt ${retryCount + 1} failed:`, error);
                    
                    if (retryCount < maxRetries) {
                        retryCount++;
                        this.showStatus(`正在重试加载数据... (${retryCount}/${maxRetries})`, false);
                        setTimeout(() => attemptLoad(), retryDelay);
                        return;
                    }
                    
                    // 所有重试都失败了
                    const errorMessage = error.message || '未知错误';
                    const isStorageError = errorMessage.includes('storage') || errorMessage.includes('数据');
                    const isAccessError = errorMessage.includes('access') || errorMessage.includes('permission') || errorMessage.includes('上下文');
                    const isConnectionError = errorMessage.includes('port closed') || errorMessage.includes('context') || errorMessage.includes('invalidated');
                    
                    this.showStatus('解析失败：' + errorMessage, true);
                    
                    let errorHtml = '<div class="error">';
                    errorHtml += '<strong>解析失败</strong><br><br>';
                    
                    if (isConnectionError) {
                        errorHtml += '扩展连接已断开，请：<br>';
                        errorHtml += '1. 刷新此页面<br>';
                        errorHtml += '2. 如果问题持续，请重新导出对话内容';
                    } else if (isStorageError) {
                        errorHtml += '数据加载失败，请：<br>';
                        errorHtml += '1. 刷新页面重试<br>';
                        errorHtml += '2. 如果问题持续，请重新导出对话内容<br>';
                        errorHtml += '3. 检查浏览器存储空间是否充足';
                    } else if (isAccessError) {
                        errorHtml += '权限访问失败，请确保：<br>';
                        errorHtml += '1. 通过扩展程序的导出按钮打开此页面<br>';
                        errorHtml += '2. 扩展程序已正确安装并启用<br>';
                        errorHtml += '3. 刷新页面后重试';
                    } else {
                        errorHtml += '请尝试以下解决方案：<br>';
                        errorHtml += '1. 刷新页面重试<br>';
                        errorHtml += '2. 重新导出对话内容<br>';
                        errorHtml += '3. 检查网络连接状态';
                    }
                    
                    errorHtml += '<br><br><small>错误详情：' + errorMessage + '</small>';
                    errorHtml += '</div>';
                    this.container.innerHTML = errorHtml;
                }
            };
            
            await attemptLoad();
            
        } else {
            this.showStatus('解析失败：未在URL中找到数据密钥', true);
            this.container.innerHTML = '<div class="error"><strong>解析失败</strong><br>请通过扩展程序的导出按钮打开此页面，不要直接在浏览器中打开。</div>';
        }
    }

    renderHeader(title, exportedAt, sourceUrl) {
        if (this.titleElement) this.titleElement.textContent = title || 'Conversation';
        if (this.timeElement) {
            const date = new Date(exportedAt);
            this.timeElement.textContent = `${i18n.t('exportTime')}: ${date.toLocaleString()}`;
        }
        if (this.sourceLink) {
            if (sourceUrl) {
                this.sourceLink.href = sourceUrl;
                this.sourceLink.style.display = 'inline';
            } else {
                this.sourceLink.style.display = 'none';
            }
        }
    }

    renderConversation(turns) {
        if (!this.container) return;
        if (!turns || turns.length === 0) {
            this.container.innerHTML = '<div class="loading">正在从存储中加载对话内容，请稍候...</div>';
            return;
        }

        console.log('[AI-ThreadStash] Rendering conversation with', turns.length, 'turns');
        
        // 调试输出：检查第一个消息的内容结构
        if (turns.length > 0) {
            console.log('[AI-ThreadStash] First turn structure:', turns[0]);
            console.log('[AI-ThreadStash] First turn content keys:', Object.keys(turns[0].content));
            console.log('[AI-ThreadStash] First turn has html:', !!turns[0].content.html);
            console.log('[AI-ThreadStash] First turn has text:', !!turns[0].content.text);
        }

        this.container.innerHTML = ''; // Clear loading message

        turns.forEach((turn, index) => {
            if (turn.role === 'system') return;

            console.log(`[AI-ThreadStash] Rendering turn ${index} (${turn.role})`);
            console.log(`[AI-ThreadStash]   Content html: ${turn.content.html ? 'exists' : 'null'}`);
            console.log(`[AI-ThreadStash]   Content text: ${turn.content.text ? 'exists' : 'null'}`);

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${turn.role}`;

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            const roleBadge = document.createElement('span');
            roleBadge.className = 'role-badge';
            roleBadge.textContent = turn.role === 'user' ? i18n.t('user') : i18n.t('assistant');
            headerDiv.appendChild(roleBadge);
            messageDiv.appendChild(headerDiv);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            // 更智能地处理内容：如果 html 不包含任何标签，则当作纯文本转换为 HTML（保留换行）
            const rawHtml = turn?.content?.html;
            const rawText = turn?.content?.text;
            const hasHtmlTags = typeof rawHtml === 'string' && /<[a-z][\s\S]*>/i.test(rawHtml);
            let contentHtml = '';
            if (hasHtmlTags) {
                console.log('[AI-ThreadStash]   Selected content type: html (has tags)');
                contentHtml = rawHtml;
            } else {
                console.log('[AI-ThreadStash]   Selected content type: text (converted)');
                const sourceText = (typeof rawHtml === 'string' && rawHtml.trim())
                    ? rawHtml
                    : (typeof rawText === 'string' ? rawText : (typeof turn.content === 'string' ? turn.content : ''));
                const converter = new showdown.Converter();
                contentHtml = converter.makeHtml(sourceText || '');
            }
            contentDiv.innerHTML = contentHtml;
            messageDiv.appendChild(contentDiv);
            
            this.container.appendChild(messageDiv);
        });

        // Set code block styling without syntax highlighting
const codeBlocks = document.querySelectorAll('pre');
codeBlocks.forEach(block => {
    block.style.setProperty('background-color', '#f5f5f5', 'important');
    block.style.setProperty('border', '1px solid #ddd', 'important');
    block.style.setProperty('border-radius', '4px', 'important');
    block.style.setProperty('padding', '12px', 'important');
    // Enforce layout-safe properties to prevent overlap
    block.style.setProperty('position', 'static', 'important');
    block.style.setProperty('z-index', 'auto', 'important');
    block.style.setProperty('display', 'block', 'important');
    block.style.setProperty('max-width', '100%', 'important');
    block.style.setProperty('width', '100%', 'important');
    block.style.setProperty('clear', 'both', 'important');
    block.style.setProperty('overflow', 'auto', 'important');
});
const codeElements = document.querySelectorAll('pre code');
codeElements.forEach(code => {
    code.style.setProperty('color', '#333333', 'important');
    code.style.setProperty('font-family', 'Consolas, Monaco, "Courier New", monospace', 'important');
    code.style.setProperty('position', 'static', 'important');
    code.style.setProperty('z-index', 'auto', 'important');
    code.style.setProperty('display', 'block', 'important');
    code.style.setProperty('max-width', '100%', 'important');
});
    }

    downloadMarkdown() {
        if (!this.conversationData) {
            this.showStatus(i18n.t('noConversationDataToDownload'), true);
            return;
        }

        try {
            const markdown = this.generateMarkdown(this.conversationData);
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.conversationData.title || 'conversation'}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show download started message instead of success
            this.showStatus(i18n.t('downloadStarted'));
        } catch (error) {
            // Download failed
            this.showStatus(i18n.t('downloadFailed'), true);
        }
    }

    downloadJson() {
        if (!this.conversationData) {
            this.showStatus(i18n.t('noConversationDataToDownload'), true);
            return;
        }

        try {
            // 生成不包含原始 HTML 的“干净”JSON：仅保留 text（若缺失则由 HTML 转换而来）
            const exportData = this.generateExportJson(this.conversationData);
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportData.title || 'conversation'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatus(i18n.t('downloadStarted'));
        } catch (error) {
            // Download failed
            this.showStatus(i18n.t('downloadFailed'), true);
        }
    }

    copyToClipboard(format = 'markdown') {
        if (!this.conversationData) {
            this.showStatus(i18n.t('noConversationDataToCopy'), true);
            return;
        }

        try {
            const content = format === 'markdown' 
                ? this.generateMarkdown(this.conversationData)
                : this.generateRichText(this.conversationData);
            
            if (format === 'markdown') {
                navigator.clipboard.writeText(content).then(() => {
                    this.showStatus(i18n.t('markdownCopySuccess'));
                }).catch(error => {
                    // Copy failed
                    this.showStatus(i18n.t('copyFailed'), true);
                });
            } else {
                const type = 'text/html';
                const blob = new Blob([content], { type });
                const data = [new ClipboardItem({ [type]: blob })];
                
                navigator.clipboard.write(data).then(() => {
                    this.showStatus(i18n.t('richTextCopySuccess'));
                }).catch(error => {
                    // Copy failed
                    this.showStatus(i18n.t('copyFailed'), true);
                });
            }
        } catch (error) {
            // Copy failed
            this.showStatus(i18n.t('copyFailed'), true);
        }
    }

    generateMarkdown(data) {
        if (!data || !data.turns || data.turns.length === 0) {
            throw new Error('No conversation data to generate markdown.');
        }

        let markdown = '';

        // Add title and metadata
        if (data.title) {
            markdown += `# ${data.title}\n\n`;
        }
        if (data.exportedAt) {
            const date = new Date(data.exportedAt);
            markdown += `${i18n.t('exportTime')}: ${date.toLocaleString()}\n\n`;
        }
        // 兼容 sourceUrl 与 url 字段
        const source = data.sourceUrl || data.url;
        if (source) {
            markdown += `${i18n.t('source')}: ${source}\n\n`;
        }

        // Add conversation content
        data.turns.forEach(turn => {
            if (turn.role === 'system') return;

            const roleLabel = turn.role === 'user' ? i18n.t('user') : i18n.t('assistant');
            markdown += `### ${roleLabel}\n\n`;

            // 统一输出为 Markdown：优先 text；若仅有 html 则转为 markdown
            const md = this.getTurnContentAsMarkdown(turn);
            markdown += md + '\n\n';
        });

        return markdown;
    }

    // Helpers: HTML -> Markdown and clean export JSON
    htmlToMarkdown(html) {
        if (!html || typeof html !== 'string') return '';
        const container = document.createElement('div');
        container.innerHTML = html;

        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue || '';
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }
            const tag = node.tagName.toLowerCase();
            const childrenMd = Array.from(node.childNodes).map(walk).join('');

            switch (tag) {
                case 'h1': return `# ${childrenMd}\n\n`;
                case 'h2': return `## ${childrenMd}\n\n`;
                case 'h3': return `### ${childrenMd}\n\n`;
                case 'h4': return `#### ${childrenMd}\n\n`;
                case 'h5': return `##### ${childrenMd}\n\n`;
                case 'h6': return `###### ${childrenMd}\n\n`;
                case 'p': return `${childrenMd}\n\n`;
                case 'br': return `\n`;
                case 'strong':
                case 'b': return `**${childrenMd}**`;
                case 'em':
                case 'i': return `*${childrenMd}*`;
                case 'code': {
                    // 若父级是 pre，则由 pre 统一处理
                    if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') return childrenMd;
                    return `\`${childrenMd}\``;
                }
                case 'pre': {
                    // 代码块：以三引号包裹
                    const text = node.textContent || childrenMd || '';
                    return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
                }
                case 'ul': {
                    const items = Array.from(node.children)
                        .filter(el => el.tagName && el.tagName.toLowerCase() === 'li')
                        .map(li => `- ${walk(li).trim()}\n`).join('');
                    return `\n${items}\n`;
                }
                case 'ol': {
                    let idx = 1;
                    const items = Array.from(node.children)
                        .filter(el => el.tagName && el.tagName.toLowerCase() === 'li')
                        .map(li => `${idx++}. ${walk(li).trim()}\n`).join('');
                    return `\n${items}\n`;
                }
                case 'li': return `${childrenMd}`;
                case 'a': {
                    const href = node.getAttribute('href') || '';
                    const text = childrenMd || href;
                    return `[${text}](${href})`;
                }
                case 'img': {
                    const alt = node.getAttribute('alt') || '';
                    const src = node.getAttribute('src') || '';
                    return `![${alt}](${src})`;
                }
                default:
                    // 对于 div / span 等容器，直接返回子内容
                    return childrenMd;
            }
        };

        let md = Array.from(container.childNodes).map(walk).join('');
        // 规范空行：最多连续两行
        md = md.replace(/\n{3,}/g, '\n\n').trim();
        return md;
    }

    // 从 turn 中提取 Markdown 文本（优先 html 转为 markdown；否则退回 text/纯字符串）
    getTurnContentAsMarkdown(turn) {
        if (!turn) return '';
        const c = turn.content;
        if (c && typeof c === 'object') {
            // 如果有 HTML，优先将 HTML 转为 Markdown（能保留列表/代码块/行内代码等结构）
            if (c.html && typeof c.html === 'string' && c.html.trim()) return this.htmlToMarkdown(c.html);
            // 否则退回到已存在的纯文本
            if (c.text && typeof c.text === 'string' && c.text.trim()) return c.text;
        }
        if (typeof c === 'string') {
            // 可能是纯文本或HTML字符串
            if (/<[a-z][\s\S]*>/i.test(c)) return this.htmlToMarkdown(c);
            return c;
        }
        // 其他类型兜底
        try { return JSON.stringify(c ?? '', null, 2); } catch { return String(c ?? ''); }
    }

    // 生成用于下载的“干净”JSON：移除 HTML，仅保留 text（必要时由 HTML 转换而来）
    generateExportJson(data) {
        const source = data?.sourceUrl || data?.url || '';
        const turns = Array.isArray(data?.turns) ? data.turns : [];
        const cleanedTurns = turns
            .filter(t => t && t.role !== 'system')
            .map(t => ({
                role: t.role,
                content: {
                    text: this.getTurnContentAsMarkdown(t)
                }
            }));
        return {
            title: data?.title || 'conversation',
            exportedAt: data?.exportedAt || new Date().toISOString(),
            url: data?.url || source,
            sourceUrl: source,
            turns: cleanedTurns
        };
    }

    generateRichText(data) {
        if (!data || !data.turns || data.turns.length === 0) {
            throw new Error('No conversation data to generate rich text.');
        }

        // Safety CSS to prevent code blocks from overlaying content in pasted HTML
        const safetyCss = `<style>
        .message-content pre { position: static !important; z-index: auto !important; display: block !important; max-width: 100% !important; width: 100% !important; clear: both !important; overflow: auto !important; }
        .message-content pre code { position: static !important; z-index: auto !important; display: block !important; max-width: 100% !important; }
        .message-content pre * { position: static !important; z-index: auto !important; }
        .message-content code:not(pre code) { position: static !important; z-index: auto !important; display: inline !important; white-space: normal !important; overflow: visible !important; max-width: 100% !important; line-height: inherit !important; vertical-align: baseline !important; }
        .message-content code:not(pre code) * { position: static !important; z-index: auto !important; display: inline !important; }
        </style>`;

        let html = '<div class="conversation">' + safetyCss;

        // Add title and metadata
        const titleText = data?.title || 'Conversation';
        html += `<h1>${titleText}</h1>`;
        if (data.exportedAt) {
            const date = new Date(data.exportedAt);
            html += `<p>${i18n.t('exportTime')}: ${date.toLocaleString()}</p>`;
        }
        const sourceLink = data?.sourceUrl || data?.url;
        if (sourceLink) {
            html += `<p>${i18n.t('source')}: <a href="${sourceLink}">${sourceLink}</a></p>`;
        }

        // Add conversation content
        data.turns.forEach(turn => {
            if (turn.role === 'system') return;

            const roleLabel = turn.role === 'user' ? i18n.t('user') : i18n.t('assistant');
            html += `<div class="message ${turn.role}">`;
            html += `<div class="message-header"><span class="role-badge">${roleLabel}</span></div>`;
            html += '<div class="message-content">';

            // 更智能地处理内容导出：无标签的 html 当作纯文本进行换行转换
            const rawHtml2 = turn?.content?.html;
            const rawText2 = turn?.content?.text;
            const hasHtmlTags2 = typeof rawHtml2 === 'string' && /<[a-z][\s\S]*>/i.test(rawHtml2);
            let exportContentHtml = '';
            if (hasHtmlTags2) {
                exportContentHtml = rawHtml2;
            } else {
                const sourceText2 = (typeof rawHtml2 === 'string' && rawHtml2.trim())
                    ? rawHtml2
                    : (typeof rawText2 === 'string' ? rawText2 : (typeof turn.content === 'string' ? turn.content : ''));
                const converter2 = new showdown.Converter();
                exportContentHtml = converter2.makeHtml(sourceText2 || '');
            }
            html += typeof exportContentHtml === 'string' ? exportContentHtml : JSON.stringify(exportContentHtml);
            
            html += '</div></div>';
        });

        html += '</div>';
        return html;
    }

    showStatus(message, isError = false) {
        if (!this.statusElement) return;

        this.statusElement.textContent = message;
        this.statusElement.className = `status-message show ${isError ? 'error' : ''}`;
        this.statusElement.style.display = 'block';

        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }

        this.statusTimeout = setTimeout(() => {
            this.statusElement.className = 'status-message';
            setTimeout(() => {
                this.statusElement.style.display = 'none';
            }, 300); // Wait for fade out animation
        }, 4000);
    }
}

// 最基础的调试输出，确保脚本能执行
console.log('[AI-ThreadStash] SCRIPT START - Preview page script executing');
console.log('[AI-ThreadStash] Document ready state:', document.readyState);
console.log('[AI-ThreadStash] Window location:', window.location.href);
console.log('[AI-ThreadStash] Chrome available:', typeof chrome);
console.log('[AI-ThreadStash] Chrome runtime:', typeof chrome?.runtime);

// 立即执行函数，确保在DOM加载前就注册
(function() {
    console.log('[AI-ThreadStash] IIFE START - Immediate function executing');
    
    // 简单测试：向background发送一个测试消息
    function testConnection() {
        console.log('[AI-ThreadStash] Testing connection to background...');
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                chrome.runtime.sendMessage({ action: 'test-connection' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[AI-ThreadStash] Test connection failed:', chrome.runtime.lastError.message);
                    } else {
                        console.log('[AI-ThreadStash] Test connection successful:', response);
                    }
                });
            } catch (error) {
                console.error('[AI-ThreadStash] Test connection error:', error);
            }
        } else {
            console.error('[AI-ThreadStash] Chrome runtime not available for test');
        }
    }
    
    // 立即测试连接
    testConnection();
    
    // 保持后台脚本活跃的机制
    function keepBackgroundAlive() {
        setInterval(() => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                try {
                    chrome.runtime.sendMessage({ action: 'keep-alive' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.log('[AI-ThreadStash] Keep-alive failed, background might be inactive');
                        }
                    });
                } catch (error) {
                    console.log('[AI-ThreadStash] Keep-alive error:', error.message);
                }
            }
        }, 30000); // 每30秒发送一次保持活跃消息
    }
    
    function initializePreview() {
        console.log('[AI-ThreadStash] INIT START - Initializing preview page...');
        
        try {
            // 确保 PreviewApp 类存在
            if (typeof PreviewApp === 'undefined') {
                console.error('[AI-ThreadStash] PreviewApp class not defined!');
                return;
            }
            
            const app = new PreviewApp();
            console.log('[AI-ThreadStash] PreviewApp created successfully');
            
            let dataLoadedFromMessage = false;
            
            // 立即注册消息监听器
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                console.log('[AI-ThreadStash] LISTENER - Registering message listener');
                
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    console.log('[AI-ThreadStash] MESSAGE RECEIVED:', request.action, request);
                    
                    if (request.action === 'preview-data') {
                        console.log('[AI-ThreadStash] PREVIEW DATA - Processing data from background');
                        try {
                            dataLoadedFromMessage = true;
                            app.conversationData = request.data;
                            app.renderHeader(app.conversationData.title, app.conversationData.exportedAt, app.conversationData.url);
                            app.renderConversation(app.conversationData.turns);
                            sendResponse({ success: true });
                            console.log('[AI-ThreadStash] PREVIEW DATA - Rendering completed');
                        } catch (error) {
                            console.error('[AI-ThreadStash] PREVIEW DATA - Error rendering:', error);
                            sendResponse({ success: false, error: error.message });
                        }
                        return true;
                    }
                });
                
                // 发送就绪信号
                console.log('[AI-ThreadStash] READY SIGNAL - Sending ready signal...');
                setTimeout(() => {
                    try {
                        chrome.runtime.sendMessage({ action: 'preview-page-ready' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('[AI-ThreadStash] READY SIGNAL FAILED:', chrome.runtime.lastError.message);
                            } else {
                                console.log('[AI-ThreadStash] READY SIGNAL SUCCESS:', response);
                            }
                        });
                    } catch (error) {
                        console.error('[AI-ThreadStash] READY SIGNAL ERROR:', error);
                    }
                }, 100);
                
            } else {
                console.error('[AI-ThreadStash] CHROME NOT AVAILABLE - Runtime:', typeof chrome?.runtime);
            }
            
            // 后备机制：从storage加载数据，延长等待时间
            setTimeout(() => {
                if (!dataLoadedFromMessage) {
                    console.log('[AI-ThreadStash] STORAGE FALLBACK - Trying storage load after 10s timeout...');
                    try {
                        app.loadConversationFromStorage();
                    } catch (error) {
                        console.error('[AI-ThreadStash] STORAGE FALLBACK ERROR:', error);
                    }
                }
            }, 10000); // 延长到10秒，给更多时间等待消息传递
            
        } catch (error) {
            console.error('[AI-ThreadStash] INIT ERROR:', error);
        }
        
        // 启动保持活跃机制
        keepBackgroundAlive();
    }
    
    // DOM ready check
    console.log('[AI-ThreadStash] DOM CHECK - Current state:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('[AI-ThreadStash] DOM LOADING - Adding event listener');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[AI-ThreadStash] DOM LOADED - Event fired');
            initializePreview();
        });
    } else {
        console.log('[AI-ThreadStash] DOM READY - Calling init immediately');
        initializePreview();
    }
})();

console.log('[AI-ThreadStash] SCRIPT END - Preview script loaded completely');

// DOM content loaded event - kept for compatibility
document.addEventListener('DOMContentLoaded', () => {
    console.log('[AI-ThreadStash] DOM content loaded event fired');
});