/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FamilyMember } from '../types';

export const initialFamilyData: FamilyMember[] = [
  // Generasi 1: Pasangan Pendiri
  {
    id: "m-1",
    name: "H. Slamet Wardoyo",
    gender: "L",
    birthDate: "1945-08-17",
    birthPlace: "Yogyakarta",
    occupation: "Pensiunan Guru",
    notes: "Patriark keluarga besar Wardoyo. Gemar berkebun dan bercerita sejarah.",
    photoUrl: "", // blank, code can render placeholder
    spouseId: "m-2"
  },
  {
    id: "m-2",
    name: "Hj. Siti Aminah",
    gender: "P",
    birthDate: "1950-04-12",
    birthPlace: "Solo",
    occupation: "Ibu Rumah Tangga",
    notes: "Matriark keluarga besar Wardoyo. Ahli memasak makanan tradisional Jawa.",
    photoUrl: "",
    spouseId: "m-1"
  },

  // Generasi 2, Anak 1: Budi Wardoyo & Pasangannya
  {
    id: "m-3",
    name: "Ir. H. Budi Wardoyo, M.T.",
    gender: "L",
    parentId: "m-1", // Anak Slamet
    spouseId: "m-4",
    birthDate: "1972-11-03",
    birthPlace: "Semarang",
    occupation: "Dosen Teknik Sipil",
    notes: "Suka membaca buku arsitektur dan mengoleksi perangko lama.",
    photoUrl: ""
  },
  {
    id: "m-4",
    name: "Dr. Hj. Dewi Lestari, Sp.A.",
    gender: "P",
    spouseId: "m-3",
    birthDate: "1974-09-25",
    birthPlace: "Bandung",
    occupation: "Dokter Spesialis Anak",
    notes: "Aktif di kegiatan sosial anak jalanan dan gemar bersepeda.",
    photoUrl: ""
  },

  // Generasi 2, Anak 2: Rina Wardoyo & Pasangannya
  {
    id: "m-5",
    name: "Rina Wardoyo, S.E.",
    gender: "P",
    parentId: "m-1", // Anak Slamet
    spouseId: "m-6",
    birthDate: "1976-05-18",
    birthPlace: "Yogyakarta",
    occupation: "Manajer Keuangan",
    notes: "Pecinta tanaman hias dan hobi membuat kue.",
    photoUrl: ""
  },
  {
    id: "m-6",
    name: "Hendra Wijaya, M.B.A.",
    gender: "L",
    spouseId: "m-5",
    birthDate: "1974-01-30",
    birthPlace: "Surabaya",
    occupation: "Wirausaha",
    notes: "Mengelola bisnis kuliner di beberapa kota. Penggemar olahraga tenis.",
    photoUrl: ""
  },

  // Generasi 2, Anak 3: Agus Wardoyo & Pasangannya
  {
    id: "m-7",
    name: "Agus Wardoyo, S.Kom.",
    gender: "L",
    parentId: "m-1", // Anak Slamet
    spouseId: "m-8",
    birthDate: "1982-12-05",
    birthPlace: "Solo",
    occupation: "Software Engineer",
    notes: "Ahli dalam pengembangan sistem IT dan pembuat aplikasi keluarga ini.",
    photoUrl: ""
  },
  {
    id: "m-8",
    name: "Rini Febriana, S.S.",
    gender: "P",
    spouseId: "m-7",
    birthDate: "1985-02-14",
    birthPlace: "Malang",
    occupation: "Penerjemah Bahasa",
    notes: "Menyukai sastra, menulis puisi, dan hobi merajut syal rajut.",
    photoUrl: ""
  },

  // Generasi 3: Anak dari Budi Wardoyo (Anak 1 Gen 2)
  {
    id: "m-9",
    name: "Aditya Wardoyo, S.T.",
    gender: "L",
    parentId: "m-3", // Anak Budi (atau Dewi)
    spouseId: "m-10",
    birthDate: "1998-06-15",
    birthPlace: "Yogyakarta",
    occupation: "Arsitek Muda",
    notes: "Pecinta fotografi urban dan pendaki gunung aktif.",
    photoUrl: ""
  },
  {
    id: "m-10",
    name: "Siska Amalia, S.Tr.Keb.",
    gender: "P",
    spouseId: "m-9",
    birthDate: "2000-10-22",
    birthPlace: "Semarang",
    occupation: "Bidan",
    notes: "Rajin berolahraga yoga dan senang membuat kerajinan tangan.",
    photoUrl: ""
  },
  {
    id: "m-11",
    name: "Anindya Wardoyo",
    gender: "P",
    parentId: "m-3", // Anak Budi
    birthDate: "2002-08-09",
    birthPlace: "Yogyakarta",
    occupation: "Mahasiswa Kedokteran",
    notes: "Anggota tim paduan suara kampus. Suka membaca novel fiksi ilmiah.",
    photoUrl: ""
  },

  // Generasi 3: Anak dari Rina Wardoyo (Anak 2 Gen 2)
  {
    id: "m-12",
    name: "Dimas Wijaya",
    gender: "L",
    parentId: "m-5", // Anak Rina
    birthDate: "2004-12-14",
    birthPlace: "Yogyakarta",
    occupation: "Mahasiswa Desain Komunikasi Visual",
    notes: "Hobi bermain game online, menggambar ilustrasi komik, dan hobi renang.",
    photoUrl: ""
  },
  {
    id: "m-13",
    name: "Laras Wijaya",
    gender: "P",
    parentId: "m-5", // Anak Rina
    birthDate: "2008-07-05",
    birthPlace: "Yogyakarta",
    occupation: "Pelajar SMA",
    notes: "Pemain biola di orkestra sekolah dan hobi menulis buku harian bergambar.",
    photoUrl: ""
  },

  // Generasi 3: Anak dari Agus Wardoyo (Anak 3 Gen 2)
  {
    id: "m-14",
    name: "Bayu Wardoyo",
    gender: "L",
    parentId: "m-7", // Anak Agus
    birthDate: "2012-03-24",
    birthPlace: "Solo",
    occupation: "Pelajar SMP",
    notes: "Pecinta robotik dan matematika. Gemar bermain lego raksasa.",
    photoUrl: ""
  },
  {
    id: "m-15",
    name: "Nabila Wardoyo",
    gender: "P",
    parentId: "m-7", // Anak Agus
    birthDate: "2015-09-11",
    birthPlace: "Solo",
    occupation: "Pelajar SD",
    notes: "Suka menari tradisional bali dan mengoleksi stiker boneka imut.",
    photoUrl: ""
  },

  // Generasi 4: Anak dari Aditya Wardoyo (Anak 1 Gen 3)
  {
    id: "m-16",
    name: "Rizky Wardoyo",
    gender: "L",
    parentId: "m-9", // Anak Aditya (atau Siska)
    birthDate: "2024-01-18",
    birthPlace: "Yogyakarta",
    occupation: "Balita",
    notes: "Cicit pertama di keluarga besar Wardoyo. Sangat ceria dan suka tertawa.",
    photoUrl: ""
  }
];
