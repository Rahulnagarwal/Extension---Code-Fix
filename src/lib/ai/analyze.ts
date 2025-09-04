import { AnalysisRequest, AnalysisResult, CodeIssue, ProviderConfig } from '@common/types';
import { getProvider } from './providers';
import { detectIssuesHeuristically } from '../heuristics';

function parseModelJson(text: string): AnalysisResult {
    // Extract first JSON block in the response safely
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        return { issues: [], suggestions: [], rawModelOutput: text };
    }
    try {
        const parsed = JSON.parse(match[0]);
        const issues = (parsed.issues as CodeIssue[]) ?? [];
        const suggestions = (parsed.suggestions as string[]) ?? [];
        return { issues, suggestions, rawModelOutput: text };
    } catch {
        return { issues: [], suggestions: [], rawModelOutput: text };
    }
}

export async function analyzeCode(req: AnalysisRequest, providerCfg: ProviderConfig): Promise<AnalysisResult> {
    // Additional sanitization: strip very long lines and potential secrets by pattern
    const pruned = req.codeSnippet
        .split('\n')
        .filter((l) => l.length < 2000)
        .join('\n')
        .replace(/(password|secret|token|api[_-]?key)\s*[:=].*/gi, '$1 = ***');

    const provider = getProvider(providerCfg);
    const text = await provider.analyze(pruned, req.language);
    const ai = parseModelJson(text);
    const heuristics = detectIssuesHeuristically(pruned);
    // Merge unique issues by title
    const mergedTitles = new Set(ai.issues.map((i) => i.title));
    const merged = ai.issues.concat(heuristics.filter((h) => !mergedTitles.has(h.title)));
    return { ...ai, issues: merged };
}


