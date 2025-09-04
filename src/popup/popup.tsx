import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MSG } from '@common/messaging';
import { AnalysisRequest, AnalysisResult, CodeIssue, UserPreferences } from '@common/types';

function usePrefs() {
    const [prefs, setPrefs] = useState<UserPreferences | null>(null);
    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_PREFS' }, (res) => setPrefs(res?.prefs ?? null));
    }, []);
    const save = useCallback((p: UserPreferences) => {
        setPrefs(p);
        chrome.runtime.sendMessage({ type: 'SET_PREFS', payload: p }, () => { });
    }, []);
    return { prefs, save };
}

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

function IssueItem({ issue }: { issue: CodeIssue }) {
    const [open, setOpen] = useState(false);
    const color = issue.severity === 'high' ? 'text-red-500' : issue.severity === 'medium' ? 'text-yellow-500' : 'text-green-500';
    return (
        <div className="issue-item" style={{ border: '1px solid #444', borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen((s) => !s)}>
                <div>
                    <strong className={color}>{issue.title}</strong>
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>({issue.category})</span>
                </div>
                <span style={{ opacity: 0.7 }}>{open ? '−' : '+'}</span>
            </div>
            {open && (
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.4 }}>
                    <div>{issue.description}</div>
                    {issue.lines && <div style={{ opacity: 0.7 }}>Lines: {issue.lines.join(', ')}</div>}
                    {issue.suggestion && (
                        <pre style={{ background: '#111', color: '#ddd', padding: 8, overflow: 'auto', borderRadius: 6 }}>{issue.suggestion}</pre>
                    )}
                </div>
            )}
        </div>
    );
}

function App() {
    const { prefs, save } = usePrefs();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [query, setQuery] = useState('');

    const filteredIssues = useMemo(() => {
        if (!result) return [] as CodeIssue[];
        return result.issues.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()) || i.description.toLowerCase().includes(query.toLowerCase()));
    }, [result, query]);

    const analyze = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url) throw new Error('No active tab');
            const payload = await chrome.tabs.sendMessage(tab.id, { type: MSG.REQUEST_EXTRACT_CODE });
            if (!payload?.payload?.code) throw new Error('No code detected on page');
            const req: AnalysisRequest = { url: tab.url, codeSnippet: payload.payload.code, language: payload.payload.language };
            const res = await chrome.runtime.sendMessage({ type: MSG.RUN_ANALYSIS, payload: req });
            if (res?.type === MSG.ANALYSIS_RESULT) setResult(res.payload as AnalysisResult);
            else if (res?.type === MSG.ERROR) throw new Error(res.error);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const copyAll = useCallback(async () => {
        if (!result) return;
        const text = [
            '# Issues',
            ...result.issues.map((i) => `- [${i.severity}] ${i.title}: ${i.description}`),
            '',
            '# Suggestions',
            ...result.suggestions
        ].join('\n');
        await navigator.clipboard.writeText(text);
    }, [result]);

    const theme = prefs?.theme ?? 'system';
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    return (
        <div style={{ background: isDark ? '#0b0b0e' : '#fff', color: isDark ? '#e5e7eb' : '#111', height: '100%', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>CodeFixer</h3>
                <button onClick={analyze} disabled={loading} style={{ padding: '6px 10px' }}>{loading ? 'Analyzing…' : 'Analyze'}</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input placeholder="Search issues" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, padding: 6 }} />
                <button onClick={copyAll} disabled={!result}>Copy</button>
            </div>
            {error && <div style={{ marginTop: 10, color: '#ef4444' }}>{error}</div>}
            <div style={{ marginTop: 12, maxHeight: 420, overflow: 'auto' }}>
                {!result && !loading && <div style={{ opacity: 0.7 }}>Click Analyze to scan the current page's code.</div>}
                {result && (
                    <>
                        <div style={{ marginBottom: 8, opacity: 0.8 }}>Found {result.issues.length} issues</div>
                        {filteredIssues.map((issue) => (
                            <IssueItem key={issue.id} issue={issue} />
                        ))}
                        {result.suggestions.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <strong>General Suggestions</strong>
                                <ul>
                                    {result.suggestions.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
            {prefs && (
                <details style={{ marginTop: 8 }}>
                    <summary>Preferences</summary>
                    <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                        <label>
                            Provider
                            <select
                                value={prefs.provider.id}
                                onChange={(e) => save({ ...prefs, provider: { ...prefs.provider, id: e.target.value as any } })}
                                style={{ width: '100%' }}
                            >
                                <option value="ollama">Ollama (local, free)</option>
                                <option value="openrouter">OpenRouter</option>
                            </select>
                        </label>
                        <label>
                            Model
                            <input value={prefs.provider.model ?? ''} onChange={(e) => save({ ...prefs, provider: { ...prefs.provider, model: e.target.value } })} />
                        </label>
                        <label>
                            API Key (if required)
                            <input type="password" value={prefs.provider.apiKey ?? ''} onChange={(e) => save({ ...prefs, provider: { ...prefs.provider, apiKey: e.target.value } })} />
                        </label>
                        <label>
                            Requests / minute
                            <input type="number" min={1} max={60} value={prefs.rateLimitPerMin}
                                onChange={(e) => save({ ...prefs, rateLimitPerMin: Number(e.target.value) })} />
                        </label>
                        <label>
                            Theme
                            <select value={prefs.theme} onChange={(e) => save({ ...prefs, theme: e.target.value as any })}>
                                <option value="system">System</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </label>
                    </div>
                </details>
            )}
        </div>
    );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
    const [err, setErr] = useState<Error | null>(null);
    return err ? (
        <div style={{ padding: 12, color: '#ef4444' }}>Error: {err.message}</div>
    ) : (
        <React.Suspense fallback={<div style={{ padding: 12 }}>Loading…</div>}>{children}</React.Suspense>
    );
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);


