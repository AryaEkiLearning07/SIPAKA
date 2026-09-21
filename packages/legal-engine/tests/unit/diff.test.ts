import { describe, it, expect } from 'vitest';
import { LegalDiffGenerator } from '../../src/diff-generator';

describe('LegalDiffGenerator Unit Tests', () => {
  it('menghasilkan isContentIdentical true jika teks persis sama', () => {
    const text = 'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan Informasi Elektronik.';
    const diff = LegalDiffGenerator.computeDiff('uu-11-2008/pasal-27', text, text, '2008', '2016');

    expect(diff.isContentIdentical).toBe(true);
    expect(diff.similarityRatio).toBe(1.0);
    expect(diff.addedCount).toBe(0);
    expect(diff.removedCount).toBe(0);
    expect(diff.tokens.length).toBe(1);
    expect(diff.tokens[0].type).toBe('unchanged');
  });

  it('mendeteksi penambahan dan penghapusan kata secara presisi dengan mempertahankan tanda baca', () => {
    const oldText = 'memiliki muatan penghinaan dan/atau pencemaran nama baik.';
    const newText = 'memiliki muatan pencemaran nama baik dan fitnah.';

    const diff = LegalDiffGenerator.computeDiff(
      'uu-11-2008/pasal-27/ayat-3',
      oldText,
      newText,
      '2008',
      '2016'
    );

    expect(diff.isContentIdentical).toBe(false);
    expect(diff.similarityRatio).toBeGreaterThan(0.6);

    // Pastikan ada token removed dan added
    const removedTokens = diff.tokens.filter((t) => t.type === 'removed');
    const addedTokens = diff.tokens.filter((t) => t.type === 'added');

    expect(removedTokens.length).toBeGreaterThan(0);
    expect(addedTokens.length).toBeGreaterThan(0);

    // Penggabungan token tidak boleh menghilangkan teks dasar
    const reconstructedNew = diff.tokens
      .filter((t) => t.type !== 'removed')
      .map((t) => t.value)
      .join('');
    expect(reconstructedNew).toBe(newText);

    const reconstructedOld = diff.tokens
      .filter((t) => t.type !== 'added')
      .map((t) => t.value)
      .join('');
    expect(reconstructedOld).toBe(oldText);
  });

  it('menangani string kosong dengan aman tanpa melempar exception', () => {
    const diff = LegalDiffGenerator.computeDiff('path', '', 'teks baru');
    expect(diff.isContentIdentical).toBe(false);
    expect(diff.addedCount).toBeGreaterThan(0);
  });
});
