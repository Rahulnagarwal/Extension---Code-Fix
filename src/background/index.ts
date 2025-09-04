import { MSG } from '@common/messaging';
import { AnalysisRequest, AnalysisResult, ProviderConfig, UserPreferences } from '@common/types';
import { analyzeCode } from '../lib/ai/analyze';
import { RateLimiter } from '../lib/rateLimiter';
import { getPreferences, setPreferences } from '../lib/storage';

const limiter = new RateLimiter(20, 60_000); // 20 req/min default, configurable via preferences

chrome.runtime.onInstalled.addListener(async () => {
    const prefs = await getPreferences();
    if (!prefs) {
        const defaultPrefs: UserPreferences = {
            theme: 'system',
            provider: { id: 'ollama', baseUrl: 'http://localhost:11434', model: 'qwen2.5-coder:7b' },
            rateLimitPerMin: 20
        };
        await setPreferences(defaultPrefs);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            if (message.type === MSG.RUN_ANALYSIS) {
                const req = message.payload as AnalysisRequest;
                const prefs = (await getPreferences())!;
                limiter.setLimitPerMinute(prefs.rateLimitPerMin);
                await limiter.acquire();
                const result: AnalysisResult = await analyzeCode(req, prefs.provider);
                sendResponse({ type: MSG.ANALYSIS_RESULT, payload: result });
                return;
            }
            if (message.type === 'GET_PREFS') {
                const prefs = await getPreferences();
                sendResponse({ ok: true, prefs });
                return;
            }
            if (message.type === 'SET_PREFS') {
                const prefs = message.payload as UserPreferences;
                await setPreferences(prefs);
                sendResponse({ ok: true });
                return;
            }
        } catch (error) {
            sendResponse({ type: MSG.ERROR, error: (error as Error).message });
        }
    })();
    return true; // Keep the message channel open for async sendResponse
});


