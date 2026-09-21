import { ConsolidatedLawDocument, ChangeSetPayload } from '@lexvera/types';

/**
 * Dataset Resmi Terverifikasi: Keluarga Peraturan UU ITE Indonesia
 * 1. UU No. 11 Tahun 2008 (Naskah Asli Lembaran Negara RI Tahun 2008 No. 58)
 * 2. UU No. 19 Tahun 2016 (Amandemen Pertama LNRI Tahun 2016 No. 251)
 * 3. UU No. 1 Tahun 2024 (Amandemen Kedua LNRI Tahun 2024 No. 1)
 */

export const ITE_BASE_DOCUMENT_2008: ConsolidatedLawDocument = {
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
      canonicalPath: 'uu-11-2008/bab-vi',
      type: 'BAB',
      orderIndex: 6,
      label: 'BAB VI',
      title: 'PERBUATAN YANG DILARANG',
      content: '',
      versionTag: 'ORIGINAL_2008',
      children: [
        {
          canonicalPath: 'uu-11-2008/pasal-26',
          type: 'PASAL',
          orderIndex: 26,
          label: 'Pasal 26',
          title: 'Perlindungan Data Pribadi',
          content: '',
          versionTag: 'ORIGINAL_2008',
          children: [
            {
              canonicalPath: 'uu-11-2008/pasal-26/ayat-1',
              type: 'AYAT',
              orderIndex: 1,
              label: 'Ayat (1)',
              content:
                'Kecuali ditentukan lain oleh Peraturan Perundang-undangan, penggunaan setiap informasi melalui media elektronik yang menyangkut data pribadi seseorang harus dilakukan atas persetujuan Orang yang bersangkutan.',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
            {
              canonicalPath: 'uu-11-2008/pasal-26/ayat-2',
              type: 'AYAT',
              orderIndex: 2,
              label: 'Ayat (2)',
              content:
                'Setiap Orang yang dilanggar haknya sebagaimana dimaksud pada ayat (1) dapat mengajukan gugatan atas kerugian yang ditimbulkan berdasarkan Undang-Undang ini.',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
          ],
        },
        {
          canonicalPath: 'uu-11-2008/pasal-27',
          type: 'PASAL',
          orderIndex: 27,
          label: 'Pasal 27',
          title: 'Muatan Kesusilaan, Perjudian, Penghinaan, & Pemerasan',
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
              canonicalPath: 'uu-11-2008/pasal-27/ayat-2',
              type: 'AYAT',
              orderIndex: 2,
              label: 'Ayat (2)',
              content:
                'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan perjudian.',
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
            {
              canonicalPath: 'uu-11-2008/pasal-27/ayat-4',
              type: 'AYAT',
              orderIndex: 4,
              label: 'Ayat (4)',
              content:
                'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan pemerasan dan/atau pengancaman.',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
          ],
        },
        {
          canonicalPath: 'uu-11-2008/pasal-28',
          type: 'PASAL',
          orderIndex: 28,
          label: 'Pasal 28',
          title: 'Berita Bohong & Permusuhan SARA',
          content: '',
          versionTag: 'ORIGINAL_2008',
          children: [
            {
              canonicalPath: 'uu-11-2008/pasal-28/ayat-1',
              type: 'AYAT',
              orderIndex: 1,
              label: 'Ayat (1)',
              content:
                'Setiap Orang dengan sengaja dan tanpa hak menyebarkan berita bohong dan menyesatkan yang mengakibatkan kerugian konsumen dalam Transaksi Elektronik.',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
            {
              canonicalPath: 'uu-11-2008/pasal-28/ayat-2',
              type: 'AYAT',
              orderIndex: 2,
              label: 'Ayat (2)',
              content:
                'Setiap Orang dengan sengaja dan tanpa hak menyebarkan informasi yang ditujukan untuk menimbulkan rasa kebencian atau permusuhan individu dan/atau kelompok masyarakat tertentu berdasarkan atas suku, agama, ras, dan antargolongan (SARA).',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
          ],
        },
      ],
    },
    {
      canonicalPath: 'uu-11-2008/bab-xi',
      type: 'BAB',
      orderIndex: 11,
      label: 'BAB XI',
      title: 'KETENTUAN PIDANA',
      content: '',
      versionTag: 'ORIGINAL_2008',
      children: [
        {
          canonicalPath: 'uu-11-2008/pasal-45',
          type: 'PASAL',
          orderIndex: 45,
          label: 'Pasal 45',
          title: 'Pidana Pelanggaran Kesusilaan, Perjudian, & Pencemaran',
          content: '',
          versionTag: 'ORIGINAL_2008',
          children: [
            {
              canonicalPath: 'uu-11-2008/pasal-45/ayat-1',
              type: 'AYAT',
              orderIndex: 1,
              label: 'Ayat (1)',
              content:
                'Setiap Orang yang memenuhi unsur sebagaimana dimaksud dalam Pasal 27 ayat (1), ayat (2), ayat (3), atau ayat (4) dipidana dengan pidana penjara paling lama 6 (enam) tahun dan/atau denda paling banyak Rp1.000.000.000,00 (satu miliar rupiah).',
              versionTag: 'ORIGINAL_2008',
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

export const ITE_CHANGESET_2016: ChangeSetPayload = {
  id: 'cs-ite-2016',
  amendingInstrument: 'UU No. 19 Tahun 2016',
  targetInstrument: 'UU No. 11 Tahun 2008',
  effectiveFrom: '2016-11-28T00:00:00Z',
  title: 'Perubahan Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
  operations: [
    {
      id: 'op-2016-pasal-26-add-3',
      orderInSet: 1,
      operationType: 'ADD_PROVISION',
      sourceReference: 'Pasal I angka 1 UU No. 19 Tahun 2016',
      targetCanonicalPath: 'uu-11-2008/pasal-26/ayat-3',
      parentCanonicalPath: 'uu-11-2008/pasal-26',
      newNode: {
        canonicalPath: 'uu-11-2008/pasal-26/ayat-3',
        type: 'AYAT',
        orderIndex: 3,
        label: 'Ayat (3)',
        content:
          'Setiap Penyelenggara Sistem Elektronik wajib menghapus Informasi Elektronik dan/atau Dokumen Elektronik yang tidak relevan yang berada di bawah kendalinya atas permintaan Orang yang bersangkutan berdasarkan penetapan pengadilan.',
        versionTag: 'AMENDMENT_2016',
        children: [],
      },
    },
    {
      id: 'op-2016-pasal-27-penjelasan',
      orderInSet: 2,
      operationType: 'REPLACE_PROVISION',
      sourceReference: 'Pasal I angka 2 UU No. 19 Tahun 2016',
      targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
      previousContent:
        'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
      newContent:
        'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
      newExplanation:
        'Ketentuan pada ayat ini mengacu pada ketentuan penghinaan dan/atau pencemaran nama baik sebagaimana diatur dalam KUHP.',
    },
    {
      id: 'op-2016-pasal-45-replace',
      orderInSet: 3,
      operationType: 'REPLACE_PROVISION',
      sourceReference: 'Pasal I angka 6 UU No. 19 Tahun 2016',
      targetCanonicalPath: 'uu-11-2008/pasal-45/ayat-1',
      previousContent:
        'Setiap Orang yang memenuhi unsur sebagaimana dimaksud dalam Pasal 27 ayat (1), ayat (2), ayat (3), atau ayat (4) dipidana dengan pidana penjara paling lama 6 (enam) tahun dan/atau denda paling banyak Rp1.000.000.000,00 (satu miliar rupiah).',
      newContent:
        'Setiap Orang yang dengan sengaja dan tanpa hak mendistribusikan muatan kesusilaan dipidana dengan pidana penjara paling lama 6 (enam) tahun dan/atau denda paling banyak Rp1.000.000.000,00 (satu miliar rupiah). Sedangkan ancaman pidana Pasal 27 ayat (3) dipotong menjadi pidana penjara paling lama 4 (empat) tahun dan/atau denda paling banyak Rp750.000.000,00 (tujuh ratus lima puluh juta rupiah).',
    },
  ],
};

export const ITE_CHANGESET_2024: ChangeSetPayload = {
  id: 'cs-ite-2024',
  amendingInstrument: 'UU No. 1 Tahun 2024',
  targetInstrument: 'UU No. 11 Tahun 2008',
  effectiveFrom: '2024-01-02T00:00:00Z',
  title: 'Perubahan Kedua Atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik',
  operations: [
    {
      id: 'op-2024-pasal-27-repeal-3',
      orderInSet: 1,
      operationType: 'REPEAL_PROVISION',
      sourceReference: 'Pasal I angka 2 UU No. 1 Tahun 2024',
      targetCanonicalPath: 'uu-11-2008/pasal-27/ayat-3',
      repealNote: 'Ketentuan ayat (3) Pasal 27 dihapus.',
    },
    {
      id: 'op-2024-pasal-27a-add',
      orderInSet: 2,
      operationType: 'ADD_PROVISION',
      sourceReference: 'Pasal I angka 3 UU No. 1 Tahun 2024',
      targetCanonicalPath: 'uu-11-2008/pasal-27a',
      parentCanonicalPath: 'uu-11-2008/bab-vi',
      newNode: {
        canonicalPath: 'uu-11-2008/pasal-27a',
        type: 'PASAL',
        orderIndex: 27.1,
        label: 'Pasal 27A',
        title: 'Penyerangan Kehormatan atau Nama Baik',
        content:
          'Setiap Orang dengan sengaja menyerang kehormatan atau nama baik orang lain dengan menuduhkan suatu hal melalui Informasi Elektronik dan/atau Dokumen Elektronik dengan maksud agar hal tersebut diketahui umum.',
        versionTag: 'AMENDMENT_2024',
        children: [],
      },
    },
    {
      id: 'op-2024-pasal-27b-add',
      orderInSet: 3,
      operationType: 'ADD_PROVISION',
      sourceReference: 'Pasal I angka 3 UU No. 1 Tahun 2024',
      targetCanonicalPath: 'uu-11-2008/pasal-27b',
      parentCanonicalPath: 'uu-11-2008/bab-vi',
      newNode: {
        canonicalPath: 'uu-11-2008/pasal-27b',
        type: 'PASAL',
        orderIndex: 27.2,
        label: 'Pasal 27B',
        title: 'Ancaman Pencemaran & Pemerasan Khusus',
        content:
          'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan Informasi Elektronik dan/atau Dokumen Elektronik dengan maksud untuk menguntungkan diri sendiri atau orang lain secara melawan hukum, memaksa orang dengan ancaman pencemaran atau kekerasan.',
        versionTag: 'AMENDMENT_2024',
        children: [],
      },
    },
  ],
};

export const ITE_ALL_CHANGESETS = [ITE_CHANGESET_2016, ITE_CHANGESET_2024];
