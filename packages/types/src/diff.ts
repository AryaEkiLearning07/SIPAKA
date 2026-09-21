export type DiffChangeType = 'unchanged' | 'added' | 'removed';

export interface DiffToken {
  type: DiffChangeType;
  value: string;
}

export interface ProvisionDiffResult {
  targetPath: string;
  sourceVersion: string;
  targetVersion: string;
  isContentIdentical: boolean;
  tokens: DiffToken[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  similarityRatio: number; // 0.0 - 1.0 (Levenshtein / LCS based)
}
