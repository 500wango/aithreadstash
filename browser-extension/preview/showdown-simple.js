// 简单的 Markdown 转换器
const showdown = {
    Converter: function() {
        return {
            makeHtml: function(text) {
                if (!text) return '';
                
                // 基本的 markdown 转换
                let html = text
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>');
                
                return html;
            }
        };
    }
};

// 确保 Prism 不存在，避免错误
if (typeof window.Prism === 'undefined') {
    window.Prism = {
        hooks: {
            add: function() {}
        },
        plugins: {
            autoloader: {}
        }
    };
}