export type OutputFormat = 'markdown' | 'json';

export type RiskLevel = 'low' | 'medium' | 'high';

export type Evidence = {
  path: string;
  detail?: string;
};

export type CommandCandidate = {
  name: string;
  command: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: Evidence[];
};

export type RepoPrimer = {
  schemaVersion: 1;
  generatedAt: string;
  root: string;
  name: string;
  summary: string;
  languages: string[];
  frameworks: string[];
  packageManager?: string;
  commands: CommandCandidate[];
  conventions: Evidence[];
  entryPoints: Evidence[];
  configs: Evidence[];
  risks: Evidence[];
  gaps: Evidence[];
  layout: Evidence[];
};

export type SuggestedTask = {
  title: string;
  risk: RiskLevel;
  rationale: string;
  evidence: Evidence[];
};
