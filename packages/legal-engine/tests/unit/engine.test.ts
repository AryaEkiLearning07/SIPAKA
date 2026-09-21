import { describe, it, expect } from 'vitest';
import { LawReconstructor } from '../../src/engine';
import { ConsolidatedLawDocument, ChangeSetPayload } from '@lexvera/types';

describe('LawReconstructor Unit Tests', () => {
  const sampleBaseDoc: ConsolidatedLawDocument = {
    instrumentType: 'UU',
    number: 11,
    year: 2008,
    title: 'Informasi dan Transaksi Elektronik',
    status: 'BERLAKU',
    asOfDate: '2008-04-21T00:00:00Z',
    activeAmendingInstruments: [],
    nodes: [
      {
        canonicalPath: 'uu-11-2008/pasal-27',
        type: 'PASAL',
        orderIndex: 27,
        label: 'Pasal 27',
        content: 'Ketentuan perbuatan yang dilarang',
        versionTag: 'ORIGINAL_2008',
        children: [
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
  };

  it('mengembalikan naskah asli jika belum ada amandemen yang berlaku', () => {
    const result = LawReconstructor.reconstructAtDate(
      sampleBaseDoc,
      [],
      '2010-01-01T00:00:00Z'
    );
    expect(result.status).toBe('BERLAKU');
    expect(result.nodes[0].children[0].content).toContain(
      'penghinaan dan/atau pencemaran nama baik'
    );
    expect(result.activeAmendingInstruments.length).toBe(0);
  });

  it('mengeksekusi REPLACE_PROVISION ketika amandemen berlaku', () => {
    const changeSet2016: ChangeSetPayload = {
      id: 'cs-2016',
      amendingInstrument: 'UU 19/2016',
      targetInstrument: 'UU 11/2008',
      effectiveFrom: '2016-11-28T00:00:00Z',
      title: 'Perubahan UU ITE 2016',
      operations: [
        {
          id: 'op-1',
          orderInSet: 1,
          operationType: 'REPLACE_PROVISION',
          sourceReference: 'Pasal I angka 1 UU No. 19 Tahun 2016',
          targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
          previousContent: sampleBaseDoc.nodes[0].children[0].content,
          newContent:
            'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan muatan penghinaan (Teks Revisi 2016).',
        },
      ],
    };

    // Sebelum 28 Nov 2016 -> Masih naskah asli
    const preSnapshot = LawReconstructor.reconstructAtDate(
      sampleBaseDoc,
      [changeSet2016],
      '2016-01-01T00:00:00Z'
    );
    expect(preSnapshot.nodes[0].children[0].content).toContain(
      'penghinaan dan/atau pencemaran nama baik'
    );

    // Pasca 28 Nov 2016 -> Berubah ke naskah revisi
    const postSnapshot = LawReconstructor.reconstructAtDate(
      sampleBaseDoc,
      [changeSet2016],
      '2016-12-01T00:00:00Z'
    );
    expect(postSnapshot.status).toBe('DIUBAH');
    expect(postSnapshot.nodes[0].children[0].content).toBe(
      'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan muatan penghinaan (Teks Revisi 2016).'
    );
    expect(postSnapshot.activeAmendingInstruments).toContain('UU 19/2016');
  });

  it('mengeksekusi ADD_PROVISION dan menolak penghapusan fisik norma (BR-02)', () => {
    const changeSet2024: ChangeSetPayload = {
      id: 'cs-2024',
      amendingInstrument: 'UU 1/2024',
      targetInstrument: 'UU 11/2008',
      effectiveFrom: '2024-01-02T00:00:00Z',
      title: 'Perubahan Kedua UU ITE 2024',
      operations: [
        {
          id: 'op-add',
          orderInSet: 1,
          operationType: 'ADD_PROVISION',
          sourceReference: 'Pasal I angka 2 UU No. 1 Tahun 2024',
          targetCanonicalPath: 'uu-11-2008/pasal-27a',
          newNode: {
            canonicalPath: 'uu-11-2008/pasal-27a',
            type: 'PASAL',
            orderIndex: 271, // 27A terletak setelah 27
            label: 'Pasal 27A',
            content:
              'Setiap Orang yang dengan sengaja menyerang kehormatan atau nama baik orang lain...',
            versionTag: 'ORIGINAL_2024',
            children: [],
          },
        },
        {
          id: 'op-repeal',
          orderInSet: 2,
          operationType: 'REPEAL_PROVISION',
          sourceReference: 'Pasal I angka 3 UU No. 1 Tahun 2024',
          targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
          repealNote: 'Dicabut dan diatur lebih lanjut pada Pasal 27A',
        },
      ],
    };

    const snapshot2024 = LawReconstructor.reconstructAtDate(
      sampleBaseDoc,
      [changeSet2024],
      '2024-02-01T00:00:00Z'
    );

    // Node 27A berhasil disisipkan
    const pasal27A = snapshot2024.nodes.find(
      (n) => n.canonicalPath === 'uu-11-2008/pasal-27a'
    );
    expect(pasal27A).toBeDefined();
    expect(pasal27A?.label).toBe('Pasal 27A');

    // Ayat 3 tidak hilang, tetapi berstatus repealed dengan tanda "Dihapus"
    const ayat3 = snapshot2024.nodes[0].children.find(
      (n) => n.canonicalPath === 'uu-11-2008/pasal-27/ayat-3'
    );
    expect(ayat3).toBeDefined();
    expect(ayat3?.isRepealed).toBe(true);
    expect(ayat3?.content).toContain('Dihapus.');
  });
});
