import { ProviderConfig } from '@common/types';

export interface AIProvider {
    analyze(code: string, language: string | null): Promise<string>;
}

function buildPrompt(code: string, language: string | null): string {
    return [
        'You are a senior code reviewer. Analyze the following code for correctness, edge cases, and performance (time and space).',
        'Return a JSON with fields: issues[{id,title,description,severity,category,lines?}], suggestions[string].',
        'Keep explanations concise and actionable. Do not include any preamble.',
        `Language: ${language ?? 'unknown'}`,
        'Code:',
        '"""',
        code.slice(0, 15000),
        '"""'
    ].join('\n');
}

export class OllamaProvider implements AIProvider {
    constructor(private config: ProviderConfig) { }
    async analyze(code: string, language: string | null): Promise<string> {
        const body = {
            model: this.config.model ?? 'qwen2.5-coder:7b',
            prompt: buildPrompt(code, language),
            stream: false,
            options: { temperature: 0.2 }
        };
        const url = `${this.config.baseUrl ?? 'http://localhost:11434'}/api/generate`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
        const data = await res.json();
        return data.response as string;
    }
}

export class OpenRouterProvider implements AIProvider {
    constructor(private config: ProviderConfig) { }
    async analyze(code: string, language: string | null): Promise<string> {
        const res = await fetch('https://api.openrouter.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey ?? ''}`
            },
            body: JSON.stringify({
                model: this.config.model ?? 'qwen/qwen-2.5-coder-7b-instruct:free',
                messages: [
                    { role: 'system', content: 'You are a precise code analysis assistant.' },
                    { role: 'user', content: buildPrompt(code, language) }
                ],
                temperature: 0.2
            })
        });
        if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? '';
    }
}

export function getProvider(config: ProviderConfig): AIProvider {
    switch (config.id) {
        case 'ollama':
            return new OllamaProvider(config);
        case 'openrouter':
            return new OpenRouterProvider(config);
        default:
            return new OllamaProvider(config);
    }
}


