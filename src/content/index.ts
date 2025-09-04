import { MSG } from '@common/messaging';

function detectLanguageFromPage(): string | null {
    const langHints = [
        document.querySelector('[data-language]')?.getAttribute('data-language'),
        document.querySelector('code[class*="language-"]')?.className.match(/language-([\w+#]+)/)?.[1] ?? null
    ].filter(Boolean) as string[];
    return langHints[0] ?? null;
}

function extractVisibleCode(): { code: string; language: string | null } {
    // Extract from <pre><code>, code editors (e.g., Monaco), and textareas. Avoid hidden nodes.
    const blocks: string[] = [];
    const codeNodes = Array.from(document.querySelectorAll('pre code, code, textarea')) as HTMLElement[];
    for (const node of codeNodes) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const text = (node as HTMLElement).innerText?.trim();
        if (text && text.split('\n').length >= 2 && text.length > 20) {
            blocks.push(text);
        }
    }
    // Monaco editor (LeetCode) specific extraction
    const monaco = document.querySelector('.monaco-editor');
    if (monaco) {
        const modelText = monaco.querySelector('.view-lines')?.textContent?.trim();
        if (modelText && modelText.length > 20) blocks.push(modelText);
    }
    const language = detectLanguageFromPage();
    return { code: blocks.join('\n\n'), language };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MSG.REQUEST_EXTRACT_CODE) {
        try {
            const { code, language } = extractVisibleCode();
            // Basic sanitization: remove obvious secrets/tokens patterns
            const sanitized = code.replace(/(api[_-]?key\s*[:=]\s*)(['\"]?)[A-Za-z0-9_\-]{16,}\2/gi, '$1***');
            sendResponse({ type: MSG.RESPONSE_EXTRACT_CODE, payload: { code: sanitized, language } });
        } catch (e) {
            sendResponse({ type: MSG.ERROR, error: (e as Error).message });
        }
        return true;
    }
});


