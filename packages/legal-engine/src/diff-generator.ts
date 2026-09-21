import { DiffToken, ProvisionDiffResult } from '@lexvera/types';

/**
 * LegalDiffGenerator
 * Generator komputasi selisih teks norma hukum Indonesia secara deterministik & zero-loss.
 * Memisahkan kata, tanda baca hukum, dan spasi dengan mempertahankan integritas naskah.
 */
export class LegalDiffGenerator {
  /**
   * Tokenize string dengan menjaga spasi dan tanda baca secara presisi
   */
  public static tokenize(text: string): string[] {
    if (!text) return [];
    // Pisahkan: kata/angka, tanda baca individual, dan whitespace sequences
    const regex = /([^\s\w]+|\s+|\w+)/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }

  /**
   * Menghitung diff antara teks lama dan teks baru
   */
  public static computeDiff(
    targetPath: string,
    sourceContent: string,
    targetContent: string,
    sourceVersion: string = 'OLD',
    targetVersion: string = 'NEW'
  ): ProvisionDiffResult {
    if (sourceContent === targetContent) {
      return {
        targetPath,
        sourceVersion,
        targetVersion,
        isContentIdentical: true,
        tokens: sourceContent ? [{ type: 'unchanged', value: sourceContent }] : [],
        addedCount: 0,
        removedCount: 0,
        unchangedCount: sourceContent ? 1 : 0,
        similarityRatio: 1.0,
      };
    }

    const tokensA = this.tokenize(sourceContent);
    const tokensB = this.tokenize(targetContent);

    // LCS Dynamic Programming Table
    const m = tokensA.length;
    const n = tokensB.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokensA[i - 1] === tokensB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtracking untuk membentuk token diff
    let i = m;
    let j = n;
    const rawDiff: DiffToken[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
        rawDiff.push({ type: 'unchanged', value: tokensA[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        rawDiff.push({ type: 'added', value: tokensB[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        rawDiff.push({ type: 'removed', value: tokensA[i - 1] });
        i--;
      }
    }

    rawDiff.reverse();

    // Kompresi token bertipe sama yang berdekatan agar output bersih
    const compressed: DiffToken[] = [];
    for (const token of rawDiff) {
      if (compressed.length > 0 && compressed[compressed.length - 1].type === token.type) {
        compressed[compressed.length - 1].value += token.value;
      } else {
        compressed.push({ ...token });
      }
    }

    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    for (const token of compressed) {
      if (token.type === 'added') addedCount++;
      else if (token.type === 'removed') removedCount++;
      else if (token.type === 'unchanged') unchangedCount++;
    }

    const lcsLength = dp[m][n];
    const totalTokens = m + n;
    const similarityRatio = totalTokens === 0 ? 1.0 : Number(((2.0 * lcsLength) / totalTokens).toFixed(4));

    return {
      targetPath,
      sourceVersion,
      targetVersion,
      isContentIdentical: false,
      tokens: compressed,
      addedCount,
      removedCount,
      unchangedCount,
      similarityRatio,
    };
  }
}
