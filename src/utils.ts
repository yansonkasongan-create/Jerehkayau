/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FamilyMember, FamilyStats } from './types';

/**
 * Calculates the exact age from a birth date string (YYYY-MM-DD)
 */
export function calculateAge(birthDate?: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Computes the levels (generations) for all family members.
 * Level 0 is the oldest ancestor generation.
 */
export function computeMemberLevels(members: FamilyMember[]): Map<string, number> {
  const levels = new Map<string, number>();
  const memberMap = new Map<string, FamilyMember>();
  
  // Index members
  members.forEach(m => memberMap.set(m.id, m));

  // Determine roots (no parentId, or parentId not in dataset)
  let queue: string[] = [];
  members.forEach(m => {
    if (!m.parentId || !memberMap.has(m.parentId)) {
      levels.set(m.id, 0);
      queue.push(m.id);
    }
  });

  // Helper to ensure spouses share the same level
  const alignSpouses = () => {
    let changed = false;
    members.forEach(m => {
      if (m.spouseId && memberMap.has(m.spouseId)) {
        const mLevel = levels.get(m.id);
        const sLevel = levels.get(m.spouseId);
        
        if (mLevel !== undefined && sLevel === undefined) {
          levels.set(m.spouseId, mLevel);
          changed = true;
        } else if (sLevel !== undefined && mLevel === undefined) {
          levels.set(m.id, sLevel);
          changed = true;
        }
      }
    });
    return changed;
  };

  // Align initially
  alignSpouses();

  // Simple BFS / iterative level calculation
  let iterations = 0;
  const maxIterations = members.length * 2; // Prevent infinite loop in bad state
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const nextQueue: string[] = [];
    
    for (const uid of queue) {
      const uLevel = levels.get(uid);
      if (uLevel === undefined) continue;

      // Find children of uid or uid's spouse
      const uMember = memberMap.get(uid);
      const spouseId = uMember?.spouseId;

      members.forEach(m => {
        if (m.parentId === uid || (spouseId && m.parentId === spouseId)) {
          const currentChildLevel = levels.get(m.id);
          const newChildLevel = uLevel + 1;
          
          if (currentChildLevel === undefined || currentChildLevel < newChildLevel) {
            levels.set(m.id, newChildLevel);
            nextQueue.push(m.id);
          }
        }
      });
    }
    
    queue = nextQueue;
    alignSpouses();
  }

  // Handle any disconnected components safely
  let unassigned = members.filter(m => !levels.has(m.id));
  if (unassigned.length > 0) {
    unassigned.forEach(m => levels.set(m.id, 0));
    alignSpouses();
  }

  return levels;
}

/**
 * Calculates statistics for the dashboard
 */
export function calculateFamilyStats(members: FamilyMember[]): FamilyStats {
  if (members.length === 0) {
    return {
      totalMembers: 0,
      totalGenerations: 0,
      maleCount: 0,
      femaleCount: 0,
      livingCount: 0,
      deceasedCount: 0,
      ageDistribution: []
    };
  }

  const levelsMap = computeMemberLevels(members);
  const maxLevel = Math.max(0, ...Array.from(levelsMap.values()));
  
  const totalMembers = members.length;
  const maleCount = members.filter(m => m.gender === 'L').length;
  const femaleCount = members.filter(m => m.gender === 'P').length;
  const deceasedCount = members.filter(m => m.isDeceased).length;
  const livingCount = totalMembers - deceasedCount;

  // Age/count distribution per generation
  const genCounts = new Map<number, number>();
  levelsMap.forEach((level) => {
    genCounts.set(level, (genCounts.get(level) || 0) + 1);
  });

  const ageDistribution = Array.from(genCounts.entries()).map(([generationIndex, count]) => ({
    generationIndex: generationIndex + 1, // Make 1-indexed to the user
    count
  })).sort((a, b) => a.generationIndex - b.generationIndex);

  return {
    totalMembers,
    totalGenerations: maxLevel + 1,
    maleCount,
    femaleCount,
    livingCount,
    deceasedCount,
    ageDistribution
  };
}

/**
 * Validates that adding a parent relationship wouldn't create a circular dependency
 */
export function checkCircularReference(
  members: FamilyMember[],
  memberId: string,
  proposedParentId: string
): boolean {
  if (memberId === proposedParentId) return true;
  if (!proposedParentId) return false;

  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));

  let currentId: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === memberId) return true; // Parent is a descendant
    if (visited.has(currentId)) break; // Circular safety
    visited.add(currentId);
    
    const current = memberMap.get(currentId);
    currentId = current?.parentId;
  }

  return false;
}

/**
 * Identifies upcoming birthdays within the next 30 days
 */
export interface BirthdayAlert {
  member: FamilyMember;
  daysRemaining: number;
  turningAge: number;
}

export function getUpcomingBirthdays(members: FamilyMember[]): BirthdayAlert[] {
  const result: BirthdayAlert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  members.forEach(m => {
    if (!m.birthDate || m.isDeceased) return;
    
    const birth = new Date(m.birthDate);
    if (isNaN(birth.getTime())) return;

    // Create a birthday for the current year
    const nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    // If birthday has already occurred this year, check next year
    if (nextBday.getTime() < today.getTime()) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBday.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show within 30 days
    if (daysRemaining <= 30) {
      const turningAge = nextBday.getFullYear() - birth.getFullYear();
      result.push({
        member: m,
        daysRemaining: daysRemaining === 365 || daysRemaining === 366 ? 0 : daysRemaining,
        turningAge
      });
    }
  });

  return result.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
