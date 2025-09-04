export type Severity = 'info' | 'low' | 'medium' | 'high';

export interface CodeIssue {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    lines?: number[];
    category: 'edge-cases' | 'time' | 'space' | 'style' | 'bug';
    suggestion?: string;
}

export interface AnalysisRequest {
    url: string;
    codeSnippet: string;
    language: string | null;
}

export interface AnalysisResult {
    issues: CodeIssue[];
    suggestions: string[];
    rawModelOutput?: string;
}

export type ProviderId = 'ollama' | 'openrouter' | 'openai' | 'huggingface' | 'none';

export interface ProviderConfig {
    id: ProviderId;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    provider: ProviderConfig;
    rateLimitPerMin: number;
}

export interface Message<T = unknown> {
    type: string;
    payload?: T;
}


