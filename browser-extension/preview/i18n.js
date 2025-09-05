// 简单的国际化实现（根据浏览器语言自动选择，未匹配则回退到英文）
const i18n = {
    translations: {
        en: {
            user: 'User',
            assistant: 'Assistant',
            exportTime: 'Exported At',
            source: 'Source',
            previewTitle: 'AI ThreadStash - Preview',
            print: 'Print to PDF',
            downloadMd: 'Download Markdown',
            downloadJson: 'Download JSON',
            copyRichText: 'Copy Rich Text',
            loading: 'Loading...',
            loadingConversation: 'Loading conversation...',
            noConversationDataToDownload: 'No conversation data to download',
            noConversationDataToCopy: 'No conversation data to copy',
            downloadStarted: 'Download started',
            downloadFailed: 'Download failed',
            markdownCopySuccess: 'Markdown copied',
            richTextCopySuccess: 'Rich text copied',
            copyFailed: 'Copy failed'
        },
        zh_CN: {
            user: '用户',
            assistant: '助手',
            exportTime: '导出时间',
            source: '来源',
            previewTitle: 'AI ThreadStash - 对话预览',
            print: '打印到PDF',
            downloadMd: '下载 Markdown',
            downloadJson: '下载 JSON',
            copyRichText: '复制为富文本',
            loading: '加载中...',
            loadingConversation: '正在加载对话内容...',
            noConversationDataToDownload: '没有对话数据可供下载',
            noConversationDataToCopy: '没有对话数据可供复制',
            downloadStarted: '下载已开始',
            downloadFailed: '下载失败',
            markdownCopySuccess: 'Markdown 复制成功',
            richTextCopySuccess: '富文本复制成功',
            copyFailed: '复制失败'
        }
    },

    currentLang: null,

    resolveLanguage: function () {
        const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(l => (l || '').toLowerCase());
        for (const lang of langs) {
            if (lang.startsWith('zh')) return 'zh_CN';
            if (lang.startsWith('en')) return 'en';
        }
        return 'en';
    },

    getCurrentLanguage: function () {
        if (!this.currentLang) {
            this.currentLang = this.resolveLanguage();
        }
        return this.currentLang;
    },

    t: function (key, params = {}) {
        const lang = this.getCurrentLanguage();
        let translation = (this.translations[lang] && this.translations[lang][key])
            || (this.translations.en && this.translations.en[key])
            || key;
        for (const [param, value] of Object.entries(params)) {
            translation = translation.replace(`{${param}}`, value);
        }
        return translation;
    }
};