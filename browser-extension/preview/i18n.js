// Multi-language support for AI ThreadStash extension
// Default language: English, with Chinese support

const SUPPORTED_LANGUAGES = {
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en',
    'zh': 'zh',
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'zh-HK': 'zh'
};

const TRANSLATIONS = {
    en: {
        // Popup interface
        appTitle: 'AI ThreadStash',
        exportChatGPT: 'Export ChatGPT Conversation',
        exportDeepSeek: 'Export DeepSeek Conversation',
        scriptCommError: 'Script communication failed, please try the following steps:',
        step1: '1. Refresh DeepSeek page',
        step2: '2. Reload extension',
        step3: '3. Reopen extension popup',
        website: 'Website',
        help: 'Help',
        version: 'v1.0.0',
        detectingPlatform: 'Detecting platform...',
        openSupportedPlatform: 'Please open a supported conversation platform',
        selectExportChatGPT: 'Select to export ChatGPT conversation',
        selectExportDeepSeek: 'Select to export DeepSeek conversation',
        unsupportedPlatform: 'Unsupported platform',
        unknownPage: 'Unknown page',
        cannotGetPageInfo: 'Cannot get page information',
        processingConversation: 'Processing conversation...',
        injectingScript: 'Injecting parsing script...',
        injectFailed: 'Injection failed',
        requestTimeout: 'Request timeout, please refresh and try again',
        parseFailed: 'Parse failed',
        exportSuccessOpeningPreview: 'Export successful! Opening preview page...',
        exportFailed: 'Export failed',
        
        // Content script messages
        exportButton: 'Export Conversation',
        exportSuccess: 'Conversation exported successfully!',
        exportError: 'Export failed, please try again',
        noConversation: 'No conversation found on this page',
        processing: 'Processing conversation...',
        
        // Preview page
        previewTitle: 'AI ThreadStash - Conversation Preview',
        downloadMd: 'Download Markdown',
        downloadJson: 'Download JSON',
        copyMarkdown: 'Copy as Markdown',
        copyRichText: 'Copy as Rich Text',
        print: 'Print to PDF',
        loading: 'Loading...',
        noResponseData: 'No response data received',
        getDataFailed: 'Failed to get data',
        dataEmpty: 'Data is empty',
        conversationDataFormatError: 'Conversation data format error',
        refreshPageRetry: 'Please refresh the page and try again. If the problem persists:',
        clearBrowserCache: 'Clear browser cache',
        reExportConversation: 'Re-export conversation content',
        pleaseEnsure: 'Please ensure:',
        openViaExportButton: 'Open this page via the export button of the extension',
        extensionInstalledEnabled: 'Extension is properly installed and enabled',
        refreshPageRetryShort: 'Please refresh the page and try again.',
        ifProblemPersists: 'If the problem persists, please re-export the conversation content.',
        dataKeyNotFound: 'Data key not found in URL',
        openViaExportButtonOnly: 'Please open this page via the export button of the extension, do not open it directly in the browser.',
        loadingConversation: 'Loading conversation content from storage, please wait...',
        noConversationDataToDownload: 'No conversation data to download.',
        markdownDownloadSuccess: 'Markdown file downloaded successfully.',
        downloadFailed: 'Download failed.',
        noConversationDataToCopy: 'No conversation data to copy.',
        markdownCopySuccess: 'Markdown content copied to clipboard.',
        copyFailed: 'Copy failed.',
        richTextCopySuccess: 'Rich text content copied to clipboard.',
        source: 'Source',
        chromeApiNotAvailable: 'Chrome API not available, please make sure to open this page through the extension.',
        conversationTitle: 'Conversation Export',
        exportTime: 'Exported at',
        sourceUrl: 'Source URL',
        
        // Role labels
        user: 'User',
        assistant: 'Assistant',
        
        // Error messages
        errorTitle: 'Export Error',
        errorMessage: 'Failed to export conversation. Please try again.',
        
        // Status messages
        copied: 'Copied to clipboard!',
        downloadStarted: 'Download started',
        printReady: 'Print dialog opened',
        
        // Additional translations
        noConversation: 'No conversation found on this page',
        scriptCommError: 'Script communication failed',
        processingFailed: 'Processing failed',
        conversationTitle: 'Conversation',
        exportButton: 'Export Conversation',
        chromeApiError: 'Cannot access Chrome API, please make sure to open this page through the extension.',
        
        // Help page translations
        helpTitle: 'Help Documentation',
        helpSubtitle: 'Intelligent conversation export tool - Making knowledge management easier',
        featuresTitle: 'Features',
        oneClickExport: 'One-click Export',
        oneClickExportDesc: 'Quickly export AI conversation content',
        multipleFormats: 'Multiple Formats',
        multipleFormatsDesc: 'Support Markdown, rich text copy, PDF printing',
        multiPlatform: 'Multi-platform Support',
        multiPlatformDesc: 'Compatible with mainstream AI conversation platforms',
        professionalLayout: 'Professional Layout',
        professionalLayoutDesc: 'Optimized printing and reading experience',
        localProcessing: 'Local Processing',
        localProcessingDesc: 'All data processed locally to protect privacy',
        supportedPlatforms: 'Supported Platforms',
        chatgptDesc: 'OpenAI Official Platform',
        deepseekDesc: 'DeepSeek AI Assistant',
        userGuide: 'User Guide',
        step1: 'Open any supported AI conversation platform (ChatGPT or DeepSeek)',
        step2: 'Start or continue a conversation',
        step3: 'Click the AI ThreadStash icon in the browser toolbar',
        step4: 'Click the "Export Current Conversation" button',
        step5: 'Choose export method in the newly opened preview page:',
        downloadMarkdown: 'Download Markdown',
        downloadMarkdownDesc: 'Save as .md file',
        exportJson: '💾 Download JSON',
        exportJsonDesc: 'Save as .json file',
        copyRichText: 'Copy as Rich Text',
        copyRichTextDesc: 'Copy formatted content to clipboard',
        printDesc: 'Generate PDF or print directly',
        faqTitle: 'Frequently Asked Questions',
        faq1Q: 'Q: Why is the export button grayed out?',
        faq1A: 'A: Please make sure you are on a supported AI conversation platform page (ChatGPT or DeepSeek).',
        faq2Q: 'Q: Does the exported content include code formatting?',
        faq2A: 'A: Yes, code blocks are automatically converted to Markdown format with syntax highlighting preserved.',
        faq3Q: 'Q: Will interface elements appear when printing?',
        faq3A: 'A: No, all interface elements are automatically hidden when printing, leaving only clean conversation content.',
        faq4Q: 'Q: Will data be uploaded to servers?',
        faq4A: 'A: No, all processing is done locally in your browser to protect your privacy and security.',
        officialWebsite: 'Official Website',
        version: 'Version',
        contactUs: 'If you have any questions or suggestions, please contact us through our official website'
    },
    
    zh: {
        // 弹窗界面
        appTitle: 'AI ThreadStash',
        exportChatGPT: '导出 ChatGPT 对话',
        exportDeepSeek: '导出 DeepSeek 对话',
        scriptCommError: '脚本通信失败，请尝试以下步骤：',
        step1: '1. 刷新DeepSeek页面',
        step2: '2. 重新加载扩展',
        step3: '3. 重新打开扩展弹窗',
        website: '官网',
        help: '帮助',
        version: 'v1.0.0',
        detectingPlatform: '检测平台中...',
        openSupportedPlatform: '请打开支持的对话平台',
        selectExportChatGPT: '选择导出 ChatGPT 对话',
        selectExportDeepSeek: '选择导出 DeepSeek 对话',
        unsupportedPlatform: '不支持的平台',
        unknownPage: '未知页面',
        cannotGetPageInfo: '无法获取页面信息',
        processingConversation: '正在解析对话内容...',
        injectingScript: '正在注入解析脚本...',
        injectFailed: '注入失败',
        requestTimeout: '请求超时，请刷新页面重试',
        parseFailed: '解析失败',
        exportSuccessOpeningPreview: '导出成功！正在打开预览页面...',
        exportFailed: '导出失败',
        
        // 内容脚本消息
        exportButton: '导出对话',
        exportSuccess: '对话导出成功！',
        exportError: '导出失败，请重试',
        noConversation: '此页面未找到对话内容',
        processing: '正在处理对话...',
        
        // 预览页面
        previewTitle: 'AI ThreadStash - 对话预览',
        downloadMd: '下载 Markdown',
        downloadJson: '下载 JSON',
        copyMarkdown: '复制为 Markdown',
        copyRichText: '复制为富文本',
        print: '打印到PDF',
        loading: '加载中...',
        noResponseData: '未收到响应数据',
        getDataFailed: '获取数据失败',
        dataEmpty: '数据为空',
        conversationDataFormatError: '对话数据格式错误',
        refreshPageRetry: '请刷新页面重试。如果问题持续存在：',
        clearBrowserCache: '清除浏览器缓存',
        reExportConversation: '重新导出对话内容',
        pleaseEnsure: '请确保：',
        openViaExportButton: '通过扩展程序的导出按钮打开此页面',
        extensionInstalledEnabled: '扩展程序已正确安装并启用',
        refreshPageRetryShort: '请刷新页面重试。',
        ifProblemPersists: '如果问题持续存在，请重新导出对话内容。',
        dataKeyNotFound: '未在URL中找到数据密钥',
        openViaExportButtonOnly: '请通过扩展程序的导出按钮打开此页面，不要直接在浏览器中打开。',
        loadingConversation: '正在从存储中加载对话内容，请稍候...',
        noConversationDataToDownload: '没有可下载的对话数据',
        markdownDownloadSuccess: 'Markdown 文件下载成功',
        downloadFailed: '下载失败',
        noConversationDataToCopy: '没有可复制的对话数据',
        markdownCopySuccess: 'Markdown 内容已复制到剪贴板',
        copyFailed: '复制失败',
        richTextCopySuccess: '富文本内容已复制到剪贴板',
        source: '来源',
        chromeApiNotAvailable: '无法访问 Chrome API，请确保通过扩展程序打开此页面。',
        conversationTitle: '对话导出',
        exportTime: '导出时间',
        sourceUrl: '来源网址',
        
        // 角色标签
        user: '用户',
        assistant: '助手',
        
        // 错误消息
        errorTitle: '导出错误',
        errorMessage: '导出对话失败，请重试。',
        
        // 状态消息
        copied: '已复制到剪贴板！',
        downloadStarted: '下载已开始',
        printReady: '打印对话框已打开',
        
        // 附加翻译
        noConversation: '未找到对话内容',
        scriptCommError: '通信失败',
        processingFailed: '处理失败',
        conversationTitle: '对话',
        exportButton: '导出对话',
        chromeApiError: '无法访问 Chrome API，请确保通过扩展程序打开此页面。',
        
        // 帮助页面翻译
        helpTitle: '帮助文档',
        helpSubtitle: '智能对话导出工具 - 让知识管理更简单',
        featuresTitle: '功能介绍',
        oneClickExport: '一键导出',
        oneClickExportDesc: '快速导出AI对话内容',
        multipleFormats: '多种格式',
        multipleFormatsDesc: '支持Markdown、富文本复制、PDF打印',
        multiPlatform: '多平台支持',
        multiPlatformDesc: '兼容主流AI对话平台',
        professionalLayout: '专业排版',
        professionalLayoutDesc: '优化的打印和阅读体验',
        localProcessing: '本地处理',
        localProcessingDesc: '所有数据在本地处理，保护隐私',
        supportedPlatforms: '支持平台',
        chatgptDesc: 'OpenAI官方平台',
        deepseekDesc: '深度求索AI助手',
        userGuide: '使用指南',
        step1: '打开任意支持的AI对话平台（ChatGPT或DeepSeek）',
        step2: '开始或继续一个对话',
        step3: '点击浏览器工具栏中的AI ThreadStash图标',
        step4: '点击"导出当前对话"按钮',
        step5: '在新打开的预览页面中选择导出方式：',
        downloadMarkdown: '下载Markdown',
        downloadMarkdownDesc: '保存为.md文件',
        exportJson: '💾 下载JSON',
        exportJsonDesc: '保存为.json文件',
        copyRichText: '复制为富文本',
        copyRichTextDesc: '复制格式化内容到剪贴板',
        printDesc: '生成PDF或直接打印',
        faqTitle: '常见问题',
        faq1Q: 'Q: 为什么导出按钮是灰色的？',
        faq1A: 'A: 请确保您正在支持的AI对话平台页面（ChatGPT或DeepSeek）。',
        faq2Q: 'Q: 导出的内容包含代码格式吗？',
        faq2A: 'A: 是的，代码块会自动转换为Markdown格式并保留语法高亮。',
        faq3Q: 'Q: 打印时会出现界面元素吗？',
        faq3A: 'A: 不会，打印时会自动隐藏所有界面元素，只保留纯净的对话内容。',
        faq4Q: 'Q: 数据会上传到服务器吗？',
        faq4A: 'A: 不会，所有处理都在本地浏览器中进行，保护您的隐私安全。',
        officialWebsite: '官方网站',
        version: '版本',
        contactUs: '如有问题或建议，请通过官网联系我们'
    }
};

// Language detection and initialization
class I18n {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.translations = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.en;
    }
    
    detectLanguage() {
        // Get browser language
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        
        // Map to supported language
        return SUPPORTED_LANGUAGES[browserLang] || 'en';
    }
    
    t(key, params = {}) {
        let text = this.translations[key] || TRANSLATIONS.en[key] || key;
        
        // Handle parameter interpolation
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(param => {
                const placeholder = `{{${param}}}`;
                text = text.replace(new RegExp(placeholder, 'g'), params[param]);
            });
        }
        
        return text;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    setLanguage(lang) {
        if (TRANSLATIONS[lang]) {
            this.currentLanguage = lang;
            this.translations = TRANSLATIONS[lang];
            return true;
        }
        return false;
    }
}

// Global instance
const i18n = new I18n();

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18n, i18n, TRANSLATIONS, SUPPORTED_LANGUAGES };
} else if (typeof window !== 'undefined') {
    window.i18n = i18n;
    window.I18n = I18n;
}