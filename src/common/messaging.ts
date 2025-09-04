import { AnalysisRequest, AnalysisResult, Message } from './types';

export const MSG = {
    REQUEST_EXTRACT_CODE: 'REQUEST_EXTRACT_CODE',
    RESPONSE_EXTRACT_CODE: 'RESPONSE_EXTRACT_CODE',
    RUN_ANALYSIS: 'RUN_ANALYSIS',
    ANALYSIS_RESULT: 'ANALYSIS_RESULT',
    ERROR: 'ERROR'
} as const;

export type ExtractCodeResponse = { code: string; language: string | null };

export type RunAnalysisMessage = Message<AnalysisRequest> & { type: typeof MSG.RUN_ANALYSIS };
export type AnalysisResultMessage = Message<AnalysisResult> & { type: typeof MSG.ANALYSIS_RESULT };


