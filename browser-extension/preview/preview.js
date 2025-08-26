class PreviewApp {
    constructor() {
        this.initI18n();
        this.initDOMElements();
        this.initEventListeners();
    }

    initI18n() {
        // Initialize internationalization for UI elements
        const elementsWithI18n = document.querySelectorAll('[data-i18n]');
        elementsWithI18n.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && i18n.t(key)) {
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
            // 通过消息传递获取数据
            chrome.runtime.sendMessage({ action: 'getConversationData', key: dataKey })
                .then(response => {
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
                })
                .catch(error => {
                    const errorMessage = error.message || '未知错误';
                     const isStorageError = errorMessage.includes('storage');
                     const isAccessError = errorMessage.includes('access') || errorMessage.includes('permission');
                     
                     this.showStatus('解析失败：' + errorMessage, true);
                     
                     let errorHtml = '<div class="error">';
                     errorHtml += '<strong>解析失败</strong><br><br>';
                     
                     if (isStorageError) {
                          errorHtml += '请刷新页面重试。如果问题持续存在：<br>';
                          errorHtml += '1. 清除浏览器缓存<br>';
                          errorHtml += '2. 重新导出对话内容';
                      } else if (isAccessError) {
                          errorHtml += '请确保：<br>';
                          errorHtml += '1. 通过扩展程序的导出按钮打开此页面<br>';
                          errorHtml += '2. 扩展程序已正确安装并启用';
                      } else {
                          errorHtml += '请刷新页面重试。<br>';
                          errorHtml += '如果问题持续存在，请重新导出对话内容。';
                      }
                     
                     errorHtml += '</div>';
                     this.container.innerHTML = errorHtml;
                });
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

        this.container.innerHTML = ''; // Clear loading message

        turns.forEach(turn => {
            if (turn.role === 'system') return;

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
            // 处理内容格式，优先使用html，然后是text
            let content = turn.content.html || turn.content.text || turn.content;
            if (typeof content === 'string' && !turn.content.html) {
                const converter = new showdown.Converter();
                content = converter.makeHtml(content);
            } else if (typeof content !== 'string') {
                content = JSON.stringify(content);
            }
            contentDiv.innerHTML = content;
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
});
const codeElements = document.querySelectorAll('pre code');
codeElements.forEach(code => {
    code.style.setProperty('color', '#333333', 'important');
    code.style.setProperty('font-family', 'Consolas, Monaco, "Courier New", monospace', 'important');
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
            const jsonData = JSON.stringify(this.conversationData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.conversationData.title || 'conversation'}.json`;
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
        if (data.sourceUrl) {
            markdown += `${i18n.t('source')}: ${data.sourceUrl}\n\n`;
        }

        // Add conversation content
        data.turns.forEach(turn => {
            if (turn.role === 'system') return;

            const roleLabel = turn.role === 'user' ? i18n.t('user') : i18n.t('assistant');
            markdown += `### ${roleLabel}\n\n`;

            // Handle different content formats
            const content = turn.content.text || turn.content.html || turn.content;
            markdown += typeof content === 'string' ? content : JSON.stringify(content);
            markdown += '\n\n';
        });

        return markdown;
    }

    generateRichText(data) {
        if (!data || !data.turns || data.turns.length === 0) {
            throw new Error('No conversation data to generate rich text.');
        }

        let html = '<div class="conversation">';

        // Add title and metadata
        if (data.title) {
            html += `<h1>${data.title}</h1>`;
        }
        if (data.exportedAt) {
            const date = new Date(data.exportedAt);
            html += `<p>${i18n.t('exportTime')}: ${date.toLocaleString()}</p>`;
        }
        if (data.sourceUrl) {
            html += `<p>${i18n.t('source')}: <a href="${data.sourceUrl}">${data.sourceUrl}</a></p>`;
        }

        // Add conversation content
        data.turns.forEach(turn => {
            if (turn.role === 'system') return;

            const roleLabel = turn.role === 'user' ? i18n.t('user') : i18n.t('assistant');
            html += `<div class="message ${turn.role}">`;
            html += `<div class="message-header"><span class="role-badge">${roleLabel}</span></div>`;
            html += '<div class="message-content">';

            // Handle different content formats
            const content = turn.content.html || turn.content.text || turn.content;
            html += typeof content === 'string' ? content : JSON.stringify(content);
            
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

document.addEventListener('DOMContentLoaded', () => {
    // Configure Prism autoloader path
    Prism.plugins.autoloader = Prism.plugins.autoloader || {};
    Prism.plugins.autoloader.languages_path = 'libs/prism/components/';

    // Add Prism hook to preserve line breaks
    Prism.hooks.add("before-highlight", function (env) {
        env.code = env.element.innerText;
    });

    const app = new PreviewApp();
    if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
        app.loadConversationFromStorage();
    } else {
        // Chrome API not available
        app.conversationData = {
            title: 'No Data Available',
            url: '',
            exportedAt: new Date().toISOString(),
            turns: []
        };
        app.renderHeader(app.conversationData.title, app.conversationData.exportedAt, app.conversationData.url);
        app.renderConversation(app.conversationData.turns);
    }
});