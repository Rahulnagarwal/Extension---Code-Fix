import { CodeIssue } from '@common/types';

let issueCounter = 0;
const nextId = () => `H-${++issueCounter}`;

export function detectIssuesHeuristically(code: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');
    const longLoops = lines
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => /for\s*\(|while\s*\(/.test(l) && /for\s*\(.*for\s*\(/.test(code));
    if (longLoops.length > 0) {
        issues.push({
            id: nextId(),
            title: 'Nested loops detected',
            description: 'Consider optimizing nested loops to reduce time complexity.',
            severity: 'medium',
            category: 'time',
            lines: longLoops.map(({ i }) => i + 1)
        });
    }
    if (/sort\(\)\.reverse\(\)/.test(code)) {
        issues.push({
            id: nextId(),
            title: 'Redundant sort then reverse',
            description: 'Use a comparator to sort descending instead of sorting then reversing.',
            severity: 'low',
            category: 'time'
        });
    }
    if (/new\s+Array\(.*\)\.fill\(/.test(code) && /map\(/.test(code)) {
        issues.push({
            id: nextId(),
            title: 'Unnecessary array allocation',
            description: 'Avoid large intermediate arrays; iterate once or use generators.',
            severity: 'low',
            category: 'space'
        });
    }
    if (/JSON\.parse\(/.test(code) && !/try\s*\{[\s\S]*JSON\.parse/.test(code)) {
        issues.push({
            id: nextId(),
            title: 'JSON.parse without error handling',
            description: 'Wrap JSON.parse in try/catch to handle invalid input.',
            severity: 'low',
            category: 'edge-cases'
        });
    }
    if (/\bdivision\b|\/(\s*0)/.test(code)) {
        issues.push({
            id: nextId(),
            title: 'Potential division by zero',
            description: 'Validate divisors before division operations.',
            severity: 'high',
            category: 'edge-cases'
        });
    }
    return issues;
}


