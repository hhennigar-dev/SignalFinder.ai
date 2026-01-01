
export enum OpportunityStatus {
  STRONG = 'strong',
  MEDIUM = 'medium',
  WEAK = 'weak'
}

export interface Quote {
  text: string;
  author: string;
  source: string;
  engagement: number | string;
  date: string;
  url: string;
}

export interface SentimentData {
  frustration: number;
  desperation: number;
  cost_pain: number;
  intensity: 'high' | 'medium' | 'low';
  insight: string;
}

export interface ValidationScores {
  frequency: number;
  urgency: number;
  monetization: number;
  overall: number;
  status: OpportunityStatus;
}

export interface ProblemOpportunity {
  id: number;
  statement: string;
  scores: ValidationScores;
  quotes: Quote[];
  sentiment: SentimentData;
  next_steps: string[];
}

export interface AnalysisMeta {
  topic: string;
  discussions_analyzed: number;
  sources: string[];
  date_range: string;
}

export interface ValidationReport {
  meta: AnalysisMeta;
  problems: ProblemOpportunity[];
  timestamp?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  topic: string;
  report: ValidationReport;
}

export interface SavedProblemEntry {
  id: string;
  timestamp: number;
  topic: string;
  problem: ProblemOpportunity;
}
