/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FamilyMember {
  id: string;
  name: string;
  gender: 'L' | 'P'; // L: Laki-laki (Male), P: Perempuan (Female)
  parentId?: string; // ID of father or mother
  spouseId?: string; // ID of husband or wife
  birthDate?: string; // YYYY-MM-DD
  birthPlace?: string;
  deathDate?: string;
  isDeceased?: boolean;
  photoUrl?: string; // Base64 raw image, Google Drive URL, or custom fallback SVG
  notes?: string;
  occupation?: string;
  phoneNumber?: string;
}

export interface FamilyStats {
  totalMembers: number;
  totalGenerations: number;
  maleCount: number;
  femaleCount: number;
  livingCount: number;
  deceasedCount: number;
  ageDistribution: {
    generationIndex: number;
    count: number;
  }[];
}
