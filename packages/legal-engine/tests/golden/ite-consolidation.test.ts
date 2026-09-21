import { describe, it, expect } from 'vitest';
import { LawReconstructor } from '../../src/engine';
import { LegalDiffGenerator } from '../../src/diff-generator';
import { ConsolidatedLawDocument, ChangeSetPayload } from '@lexvera/types';

/**
 * Golden Test Suite: Keluarga UU ITE
 * UU No. 11 Tahun 2008 -> UU No. 19 Tahun 2016 -> UU No. 1 Tahun 2024
 * Membuktikan determinisme konsolidasi naskah hukum point-in-time
 */
describe('Golden Test Suite - Konsolidasi UU ITE (2008, 2016, 2024)', () => {
  const baseDocumentITE2008: ConsolidatedLawDocument = {
    instrumentType: 'UU',
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    shortTitle: 'UU ITE 2008',
    status: 'BERLAKU',
    asOfDate: '2008-04-21T00:00:00Z',
    activeAmendingInstruments: [],
    nodes: [
      {
        canonicalPath: 'uu-11-2008/bab-vii',
        type: 'BAB',
        orderIndex: 7,
        label: 'BAB VII',
        title: 'PERBUATAN YANG DILARANG',
        content: '',
        versionTag: 'ORIGINAL_2008',
        children: [
          {
            canonicalPath: 'uu-11-2008/pasal-27',
            type: 'PASAL',
            orderIndex: 27,
            label: 'Pasal 27',
            content: '',
            versionTag: 'ORIGINAL_2008',
            children: [
              {
                canonicalPath: 'uu-11-2008/pasal-27/ayat-1',
                type: 'AYAT',
                orderIndex: 1,
                label: 'Ayat (1)',
                content:
                  'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan yang melanggar kesusilaan.',
                versionTag: 'ORIGINAL_2008',
                children: [],
              },
              {
                canonicalPath: 'uu-11-2008/pasal-27/ayat-3',
                type: 'AYAT',
                orderIndex: 3,
                label: 'Ayat (3)',
                content:
                  'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
                versionTag: 'ORIGINAL_2008',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };

  const changeSet2016: ChangeSetPayload = {
    id: 'cs-ite-2016',
    amendingInstrument: 'UU No. 19 Tahun 2016',
    targetInstrument: 'UU No. 11 Tahun 2008',
    effectiveFrom: '2016-11-28T00:00:00Z',
    title: 'Perubahan Atas UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    operations: [
      {
        id: 'op-ite-2016-pasal-27-penjelasan',
        orderInSet: 1,
        operationType: 'REPLACE_PROVISION',
        sourceReference: 'Pasal I angka 1 UU No. 19 Tahun 2016',
        targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
        previousContent:
          'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
        newContent:
          'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
        newExplanation:
          'Ketentuan pada ayat ini mengacu pada ketentuan penghinaan dan/atau pencemaran nama baik sebagaimana diatur dalam KUHP.',
      },
    ],
  };

  const changeSet2024: ChangeSetPayload = {
    id: 'cs-ite-2024',
    amendingInstrument: 'UU No. 1 Tahun 2024',
    targetInstrument: 'UU No. 11 Tahun 2008',
    effectiveFrom: '2024-01-02T00:00:00Z',
    title: 'Perubahan Kedua Atas UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
    operations: [
      {
        id: 'op-ite-2024-repeal-27-3',
        orderInSet: 1,
        operationType: 'REPEAL_PROVISION',
        sourceReference: 'Pasal I angka 2 UU No. 1 Tahun 2024',
        targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
        repealNote: 'Ketentuan ayat (3) Pasal 27 dihapus.',
      },
      {
        id: 'op-ite-2024-add-27a',
        orderInSet: 2,
        operationType: 'ADD_PROVISION',
        sourceReference: 'Pasal I angka 3 UU No. 1 Tahun 2024',
        targetCanonicalPath: 'uu-11-2008/pasal-27a',
        parentCanonicalPath: 'uu-11-2008/bab-vii',
        newNode: {
          canonicalPath: 'uu-11-2008/pasal-27a',
          type: 'PASAL',
          orderIndex: 27.1,
          label: 'Pasal 27A',
          content:
            'Setiap Orang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal melalui Informasi Elektronik dan/atau Dokumen Elektronik dengan maksud agar hal tersebut diketahui umum.',
          versionTag: 'AMENDMENT_2024',
          children: [],
        },
      },
      {
        id: 'op-ite-2024-add-27b',
        orderInSet: 3,
        operationType: 'ADD_PROVISION',
        sourceReference: 'Pasal I angka 3 UU No. 1 Tahun 2024',
        targetCanonicalPath: 'uu-11-2008/pasal-27b',
        parentCanonicalPath: 'uu-11-2008/bab-vii',
        newNode: {
          canonicalPath: 'uu-11-2008/pasal-27b',
          type: 'PASAL',
          orderIndex: 27.2,
          label: 'Pasal 27B',
          content:
            'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan Informasi Elektronik untuk menguntungkan diri sendiri secara melawan hukum dengan ancaman pencemaran.',
          versionTag: 'AMENDMENT_2024',
          children: [],
        },
      },
    ],
  };

  it('Fase 1 (2012): Rekonstruksi era UU 11/2008 murni sebelum amandemen', () => {
    const snap2012 = LawReconstructor.reconstructAtDate(
      baseDocumentITE2008,
      [changeSet2016, changeSet2024],
      '2012-05-10T00:00:00Z'
    );

    expect(snap2012.status).toBe('BERLAKU');
    expect(snap2012.activeAmendingInstruments.length).toBe(0);

    const babVII = snap2012.nodes[0];
    const pasal27 = babVII.children.find((p) => p.label === 'Pasal 27')!;
    const ayat3 = pasal27.children.find((a) => a.label === 'Ayat (3)')!;

    expect(ayat3.isRepealed).toBeFalsy();
    expect(ayat3.content).toContain('memiliki muatan penghinaan dan/atau pencemaran nama baik');
    expect(ayat3.explanation).toBeUndefined();

    // Pasal 27A dan 27B belum ada
    expect(babVII.children.some((p) => p.label === 'Pasal 27A')).toBe(false);
  });

  it('Fase 2 (2020): Rekonstruksi era UU 19/2016 (Amandemen Pertama aktif)', () => {
    const snap2020 = LawReconstructor.reconstructAtDate(
      baseDocumentITE2008,
      [changeSet2016, changeSet2024],
      '2020-08-17T00:00:00Z'
    );

    expect(snap2020.status).toBe('DIUBAH');
    expect(snap2020.activeAmendingInstruments).toEqual(['UU No. 19 Tahun 2016']);

    const babVII = snap2020.nodes[0];
    const pasal27 = babVII.children.find((p) => p.label === 'Pasal 27')!;
    const ayat3 = pasal27.children.find((a) => a.label === 'Ayat (3)')!;

    expect(ayat3.isRepealed).toBeFalsy();
    expect(ayat3.explanation).toContain('mengacu pada ketentuan penghinaan');
    expect(babVII.children.some((p) => p.label === 'Pasal 27A')).toBe(false);
  });

  it('Fase 3 (2024): Rekonstruksi era UU 1/2024 (Amandemen Kedua: Pasal 27 ayat 3 dihapus, 27A & 27B lahir)', () => {
    const snap2024 = LawReconstructor.reconstructAtDate(
      baseDocumentITE2008,
      [changeSet2016, changeSet2024],
      '2024-06-01T00:00:00Z'
    );

    expect(snap2024.status).toBe('DIUBAH');
    expect(snap2024.activeAmendingInstruments).toContain('UU No. 19 Tahun 2016');
    expect(snap2024.activeAmendingInstruments).toContain('UU No. 1 Tahun 2024');

    const babVII = snap2024.nodes[0];
    const pasal27 = babVII.children.find((p) => p.label === 'Pasal 27')!;
    const ayat3 = pasal27.children.find((a) => a.label === 'Ayat (3)')!;

    // Prinsip BR-02 Repeal Invariant: node tetap ada, ditandai Dihapus
    expect(ayat3.isRepealed).toBe(true);
    expect(ayat3.content).toContain('Dihapus.');

    // Pasal 27A dan 27B berhasil disisipkan secara deterministik
    const pasal27A = babVII.children.find((p) => p.label === 'Pasal 27A');
    const pasal27B = babVII.children.find((p) => p.label === 'Pasal 27B');

    expect(pasal27A).toBeDefined();
    expect(pasal27A?.content).toContain('menyerang kehormatan atau nama baik');
    expect(pasal27B).toBeDefined();
    expect(pasal27B?.content).toContain('menguntungkan diri sendiri secara melawan hukum');
  });

  it('Verifikasi Diff Komparatif: Selisih Naskah 2008 vs 2024 menghasilkan pemetaan yang akurat', () => {
    const snap2008 = LawReconstructor.reconstructAtDate(
      baseDocumentITE2008,
      [changeSet2016, changeSet2024],
      '2008-05-01T00:00:00Z'
    );
    const snap2024 = LawReconstructor.reconstructAtDate(
      baseDocumentITE2008,
      [changeSet2016, changeSet2024],
      '2024-06-01T00:00:00Z'
    );

    const oldAyat3 = snap2008.nodes[0].children[0].children[1].content;
    const newAyat3 = snap2024.nodes[0].children[0].children[1].content;

    const diff = LegalDiffGenerator.computeDiff(
      'uu-11-2008/pasal-27/ayat-3',
      oldAyat3,
      newAyat3,
      '2008',
      '2024'
    );

    expect(diff.isContentIdentical).toBe(false);
    expect(diff.removedCount).toBeGreaterThan(0);
    expect(diff.tokens.some((t) => t.type === 'removed' && t.value.includes('penghinaan'))).toBe(
      true
    );
    expect(diff.tokens.some((t) => t.type === 'added' && t.value.includes('Dihapus'))).toBe(true);
  });
});
