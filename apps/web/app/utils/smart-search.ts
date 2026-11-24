/**
 * SIPAKA Smart Legal Search Engine & Typo Tolerance Utility
 * Memberikan kapabilitas pencarian cerdas ala search engine:
 * 1. Tokenized Search (tidak terikat posisi kata kaku)
 * 2. Kamus Alias & Singkatan Hukum Populer Indonesia
 * 3. Typo Tolerance (Fuzzy Levenshtein Distance)
 * 4. Peringkat Relevansi (Relevance Scoring)
 */

export interface LegalAlias {
  id: string;
  popularName: string;
  canonicalSlug?: string;
  searchKeywords: string[];
  description: string;
}

export const POPULAR_LEGAL_ALIASES: LegalAlias[] = [
  {
    id: 'kuhp',
    popularName: 'KUHP Baru (Kitab Undang-Undang Hukum Pidana)',
    canonicalSlug: 'uu-1-2023',
    searchKeywords: ['kuhp', 'kuhp baru', 'hukum pidana', 'pidana', 'uu 1 2023', 'uu 1 tahun 2023'],
    description: 'UU No. 1 Tahun 2023 tentang Kitab Undang-Undang Hukum Pidana',
  },
  {
    id: 'ite',
    popularName: 'UU ITE (Informasi & Transaksi Elektronik)',
    canonicalSlug: 'ite',
    searchKeywords: ['ite', 'uu ite', 'transaksi elektronik', 'informasi elektronik', 'uu 11 2008', 'uu 1 2024', 'uu 19 2016'],
    description: 'UU No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 jo. UU No. 1 Tahun 2024',
  },
  {
    id: 'ciptaker',
    popularName: 'UU Cipta Kerja (Omnibus Law)',
    canonicalSlug: 'uu-no-6-tahun-2023',
    searchKeywords: ['cipta kerja', 'ciptaker', 'omnibus law', 'uu ciptaker', 'uu cipta kerja', 'uu 6 2023', 'uu 11 2020', 'perpu ciptaker'],
    description: 'UU No. 6 Tahun 2023 tentang Cipta Kerja (sebelumnya UU 11/2020)',
  },
  {
    id: 'pdp',
    popularName: 'UU PDP (Pelindungan Data Pribadi)',
    canonicalSlug: 'uu-no-27-tahun-2022',
    searchKeywords: ['pdp', 'uu pdp', 'data pribadi', 'pelindungan data', 'perlindungan data', 'uu 27 2022', 'uu 27 tahun 2022'],
    description: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi',
  },
  {
    id: 'tipikor',
    popularName: 'UU Tipikor (Pemberantasan Tindak Pidana Korupsi)',
    canonicalSlug: 'uu-no-31-tahun-1999',
    searchKeywords: ['tipikor', 'uu tipikor', 'korupsi', 'pemberantasan korupsi', 'uu 31 1999', 'uu 20 2001'],
    description: 'UU No. 31 Tahun 1999 jo. UU No. 20 Tahun 2001',
  },
  {
    id: 'kpk',
    popularName: 'UU Komisi Pemberantasan Korupsi (KPK)',
    canonicalSlug: 'uu-no-19-tahun-2019',
    searchKeywords: ['kpk', 'uu kpk', 'komisi korupsi', 'uu 19 2019', 'uu 30 2002'],
    description: 'UU No. 19 Tahun 2019 tentang KPK',
  },
  {
    id: 'uupk',
    popularName: 'UU Perlindungan Konsumen (UUPK)',
    canonicalSlug: 'uu-no-8-tahun-1999',
    searchKeywords: ['uupk', 'konsumen', 'perlindungan konsumen', 'uu 8 1999'],
    description: 'UU No. 8 Tahun 1999 tentang Perlindungan Konsumen',
  },
  {
    id: 'pt',
    popularName: 'UU PT (Perseroan Terbatas)',
    canonicalSlug: 'uu-no-40-tahun-2007',
    searchKeywords: ['pt', 'uu pt', 'perseroan terbatas', 'perseroan', 'uu 40 2007'],
    description: 'UU No. 40 Tahun 2007 tentang Perseroan Terbatas',
  },
  {
    id: 'pajak',
    popularName: 'UU HPP (Harmonisasi Peraturan Perpajakan)',
    canonicalSlug: 'uu-no-7-tahun-2021',
    searchKeywords: ['pajak', 'hpp', 'perpajakan', 'uu hpp', 'uu 7 2021'],
    description: 'UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan',
  },
  {
    id: 'kesehatan',
    popularName: 'UU Kesehatan (Omnibus Law Kesehatan)',
    canonicalSlug: 'uu-no-17-tahun-2023',
    searchKeywords: ['kesehatan', 'uu kesehatan', 'medis', 'rumah sakit', 'uu 17 2023'],
    description: 'UU No. 17 Tahun 2023 tentang Kesehatan',
  },
  {
    id: 'advokat',
    popularName: 'UU Advokat & Profesi Hukum',
    canonicalSlug: 'uu-no-18-tahun-2003',
    searchKeywords: ['advokat', 'uu advokat', 'pengacara', 'uu 18 2003'],
    description: 'UU No. 18 Tahun 2003 tentang Advokat',
  },
  {
    id: 'mk',
    popularName: 'UU Mahkamah Konstitusi (MK)',
    canonicalSlug: 'uu-no-24-tahun-2003',
    searchKeywords: ['mk', 'uu mk', 'mahkamah konstitusi', 'uu 24 2003'],
    description: 'UU No. 24 Tahun 2003 tentang Mahkamah Konstitusi',
  },
  {
    id: 'ham',
    popularName: 'UU HAM (Hak Asasi Manusia)',
    canonicalSlug: 'uu-no-39-tahun-1999',
    searchKeywords: ['ham', 'uu ham', 'hak asasi manusia', 'uu 39 1999'],
    description: 'UU No. 39 Tahun 1999 tentang Hak Asasi Manusia',
  },
  {
    id: 'perkawinan',
    popularName: 'UU Perkawinan',
    canonicalSlug: 'uu-no-1-tahun-1974',
    searchKeywords: ['perkawinan', 'nikah', 'uu perkawinan', 'uu 1 1974', 'uu 16 2019'],
    description: 'UU No. 1 Tahun 1974 jo. UU No. 16 Tahun 2019',
  },
  {
    id: 'kepailitan',
    popularName: 'UU Kepailitan & PKPU',
    canonicalSlug: 'uu-no-37-tahun-2004',
    searchKeywords: ['kepailitan', 'pailit', 'pkpu', 'uu kepailitan', 'uu 37 2004'],
    description: 'UU No. 37 Tahun 2004 tentang Kepailitan dan Penundaan Kewajiban Pembayaran Utang',
  },
  {
    id: 'tppu',
    popularName: 'UU TPPU (Pencegahan Pencucian Uang)',
    canonicalSlug: 'uu-no-8-tahun-2010',
    searchKeywords: ['tppu', 'pencucian uang', 'money laundering', 'uu 8 2010'],
    description: 'UU No. 8 Tahun 2010 tentang Pencegahan dan Pemberantasan Tindak Pidana Pencucian Uang',
  },
];

/**
 * Hitung Levenshtein Distance untuk mengukur kedekatan string (toleransi typo).
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // penghapusan
          dp[i][j - 1] + 1,     // penyisipan
          dp[i - 1][j - 1] + 1  // penggantian
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Periksa apakah kata terduga typo mirip dengan target.
 */
export function isFuzzyMatch(queryWord: string, targetWord: string): boolean {
  if (queryWord === targetWord) return true;
  if (queryWord.length < 3) return false;

  const dist = levenshteinDistance(queryWord, targetWord);
  // Maksimal 1 kesalahan untuk kata 3-5 huruf, maksimal 2 kesalahan untuk kata > 5 huruf
  if (queryWord.length <= 5) return dist <= 1;
  return dist <= 2;
}

/**
 * Cek kemiripan query dengan kamus alias hukum dan cari koreksi typo jika ada.
 */
export function checkAliasAndTypo(query: string): {
  matchedAlias?: LegalAlias;
  suggestedCorrection?: string;
} {
  const qClean = query.trim().toLowerCase();
  if (!qClean) return {};

  // 1. Direct match alias
  for (const alias of POPULAR_LEGAL_ALIASES) {
    if (alias.searchKeywords.some((k) => k === qClean || qClean.includes(k))) {
      return { matchedAlias: alias };
    }
  }

  // 2. Fuzzy match pada keyword alias (toleransi typo kata penting)
  for (const alias of POPULAR_LEGAL_ALIASES) {
    for (const kw of alias.searchKeywords) {
      if (isFuzzyMatch(qClean, kw)) {
        return {
          matchedAlias: alias,
          suggestedCorrection: kw,
        };
      }
    }
  }

  return {};
}

/**
 * Penilaian Relevansi Dokumen Terhadap Query Pengguna (Skor Relevansi).
 * Menghasilkan skor 0 jika tidak cocok sama sekali, skor tinggi jika sangat relevan.
 */
export function calculateRelevanceScore(
  law: {
    title: string;
    shortTitle?: string;
    number?: number | string;
    year?: number;
    slug?: string;
    description?: string;
  },
  rawQuery: string,
  matchedAlias?: LegalAlias
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 1;

  let score = 0;
  const titleLower = law.title.toLowerCase();
  const shortLower = (law.shortTitle || '').toLowerCase();
  const slugLower = (law.slug || '').toLowerCase();
  const numStr = String(law.number || '');
  const yrStr = String(law.year || '');
  const descLower = (law.description || '').toLowerCase();

  // 1. Jika cocok dengan alias hukum yang dimaksud
  if (matchedAlias) {
    if (matchedAlias.canonicalSlug && (slugLower === matchedAlias.canonicalSlug || slugLower.includes(matchedAlias.canonicalSlug))) {
      score += 100;
    }
    for (const kw of matchedAlias.searchKeywords) {
      if (titleLower.includes(kw)) score += 30;
      if (shortLower.includes(kw)) score += 40;
    }
  }

  // 2. Exact match substring
  if (titleLower.includes(q)) score += 50;
  if (shortLower.includes(q)) score += 60;
  if (slugLower.includes(q)) score += 40;

  // 3. Multi-token match (semua kata ada, meski urutan acak)
  const tokens = q.split(/\s+/).filter((t) => t.length > 0 && !['uu', 'undang', 'undang-undang', 'nomor', 'no', 'tahun', 'tentang'].includes(t));
  if (tokens.length > 0) {
    let tokensMatched = 0;
    for (const token of tokens) {
      if (
        titleLower.includes(token) ||
        shortLower.includes(token) ||
        numStr === token ||
        yrStr === token ||
        slugLower.includes(token) ||
        descLower.includes(token)
      ) {
        tokensMatched++;
        score += 15;
      } else {
        // Cek fuzzy per kata
        const wordsInTitle = titleLower.split(/[\s,.-]+/);
        if (wordsInTitle.some((w) => isFuzzyMatch(token, w))) {
          tokensMatched++;
          score += 8;
        }
      }
    }
    // Jika semua token substansial cocok
    if (tokensMatched === tokens.length) {
      score += 35;
    }
  } else {
    // Pengguna hanya mengetik kata umum seperti "uu 1 2023"
    const numberMatches = q.match(/\b\d+\b/g);
    if (numberMatches) {
      for (const n of numberMatches) {
        if (numStr === n) score += 20;
        if (yrStr === n) score += 20;
      }
    }
  }

  return score;
}
