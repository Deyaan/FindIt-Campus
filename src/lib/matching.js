import { supabase } from './supabase.js';

/**
 * Standard English Stop Words to filter out common non-distinguishing terms
 */
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does',
  'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll',
  'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no',
  'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
  'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve',
  'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'lost', 'found'
]);

/**
 * Normalizes text and tokenizes into a unique Set of lowercase words
 * excluding punctuation and stop words.
 *
 * @param {string} text
 * @returns {Set<string>}
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return new Set();

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));

  return new Set(words);
}

/**
 * Calculates Jaccard similarity: |A ∩ B| / |A ∪ B|
 * Handles empty sets safely without division by zero.
 *
 * @param {Set<string>} tokensA
 * @param {Set<string>} tokensB
 * @returns {number} Float between 0.0 and 1.0
 */
export function calculateJaccardSimilarity(tokensA, tokensB) {
  if (!tokensA || !tokensB || tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  if (unionCount === 0) return 0;

  return intersectionCount / unionCount;
}

/**
 * Compares categories (case-insensitive)
 *
 * @param {string} categoryA
 * @param {string} categoryB
 * @returns {number} 30 points if exact match, 0 otherwise
 */
export function scoreCategory(categoryA, categoryB) {
  if (!categoryA || !categoryB) return 0;
  return categoryA.trim().toLowerCase() === categoryB.trim().toLowerCase() ? 30 : 0;
}

const GENERIC_LOCATION_TERMS = new Set([
  'building', 'complex', 'hall', 'center', 'centre', 'room', 'floor', 'area',
  'campus', 'block', 'zone', 'wing', 'level', 'gate', 'near'
]);

/**
 * Compares campus locations
 *
 * @param {string} locA
 * @param {string} locB
 * @returns {number} 25 for exact, 15 for partial, 0 otherwise
 */
export function scoreLocation(locA, locB) {
  if (!locA || !locB) return 0;

  const a = locA.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const b = locB.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!a || !b) return 0;
  if (a === b) return 25;

  // Substring containment (e.g. "Main Library 2nd Floor" vs "Main Library")
  if (a.includes(b) || b.includes(a)) {
    return 15;
  }

  // Shared distinctive keyword match (minimum 3 characters, excluding generic terms like 'complex', 'building')
  const wordsA = new Set(
    a.split(' ').filter((w) => w.length >= 3 && !GENERIC_LOCATION_TERMS.has(w))
  );
  const wordsB = b.split(' ').filter((w) => w.length >= 3 && !GENERIC_LOCATION_TERMS.has(w));
  const sharesDistinctiveKeyword = wordsB.some((w) => wordsA.has(w));

  return sharesDistinctiveKeyword ? 15 : 0;
}

/**
 * Calculates date proximity score
 * Same date or 1 day apart: 15
 * 2–3 days apart: 10
 * 4–7 days apart: 5
 * More than 7 days apart or invalid dates: 0
 *
 * @param {string} dateA - ISO YYYY-MM-DD
 * @param {string} dateB - ISO YYYY-MM-DD
 * @returns {{ score: number, daysApart: number | null }}
 */
export function scoreDateProximity(dateA, dateB) {
  if (!dateA || !dateB) return { score: 0, daysApart: null };

  const tA = Date.parse(dateA + 'T00:00:00Z');
  const tB = Date.parse(dateB + 'T00:00:00Z');

  if (Number.isNaN(tA) || Number.isNaN(tB)) {
    return { score: 0, daysApart: null };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysApart = Math.round(Math.abs(tA - tB) / msPerDay);

  if (daysApart <= 1) return { score: 15, daysApart };
  if (daysApart <= 3) return { score: 10, daysApart };
  if (daysApart <= 7) return { score: 5, daysApart };
  return { score: 0, daysApart };
}

/**
 * Computes deterministic match score (0–100) between two items
 *
 * Scoring Breakdown:
 * 1. Category Similarity: 30 pts
 * 2. Description Jaccard: 30 pts
 * 3. Location Match: 25 pts
 * 4. Date Proximity: 15 pts
 *
 * @param {Object} itemA
 * @param {Object} itemB
 * @returns {{ score: number, breakdown: Object, details: Object }}
 */
export function computeMatchScore(itemA, itemB) {
  if (!itemA || !itemB) {
    return {
      score: 0,
      breakdown: { category: 0, description: 0, location: 0, date: 0 },
      details: {
        categoryMatched: false,
        jaccardSimilarity: 0,
        locationMatchType: 'none',
        daysApart: null,
      },
    };
  }

  // 1. Category (30 pts)
  const categoryScore = scoreCategory(itemA.category, itemB.category);

  // 2. Description similarity using Jaccard (30 pts)
  const tokensA = tokenizeText(itemA.description);
  const tokensB = tokenizeText(itemB.description);
  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);
  const descriptionScore = Math.round(jaccard * 30);

  // 3. Location match (25 pts)
  const locationScore = scoreLocation(itemA.location, itemB.location);

  // 4. Date proximity (15 pts)
  const dateResult = scoreDateProximity(itemA.date_incident, itemB.date_incident);
  const dateScore = dateResult.score;

  const totalScore = categoryScore + descriptionScore + locationScore + dateScore;

  return {
    score: totalScore,
    breakdown: {
      category: categoryScore,
      description: descriptionScore,
      location: locationScore,
      date: dateScore,
    },
    details: {
      categoryMatched: categoryScore === 30,
      jaccardSimilarity: Math.round(jaccard * 100) / 100,
      locationMatchType: locationScore === 25 ? 'exact' : locationScore === 15 ? 'partial' : 'none',
      daysApart: dateResult.daysApart,
    },
  };
}

/**
 * Fetches active counter-reports from Supabase, scores them deterministically,
 * and returns the top candidates above minScore.
 *
 * @param {Object} targetItem - The item to find matches for
 * @param {number} minScore - Minimum score threshold (default: 30)
 * @param {number} limit - Maximum number of matches to return (default: 5)
 * @returns {Promise<{ matches: Array, error: string | null }>}
 */
export async function getPotentialMatches(targetItem, minScore = 30, limit = 5) {
  if (!targetItem || !targetItem.id || !targetItem.type) {
    return { matches: [], error: null };
  }

  const counterType = targetItem.type === 'lost' ? 'found' : 'lost';

  try {
    const { data, error } = await supabase
      .from('items')
      .select('id, user_id, type, title, category, description, location, date_incident, photo_path, status, created_at')
      .eq('status', 'active')
      .eq('type', counterType)
      .neq('id', targetItem.id)
      .limit(50); // Bounded candidate retrieval

    if (error) {
      console.error('[FindIt Matching Query Error]:', error);
      return { matches: [], error: error.message };
    }

    const scoredCandidates = (data || [])
      .map((candidate) => {
        const matchResult = computeMatchScore(targetItem, candidate);
        return {
          item: candidate,
          score: matchResult.score,
          breakdown: matchResult.breakdown,
          details: matchResult.details,
        };
      })
      .filter((entry) => entry.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { matches: scoredCandidates, error: null };
  } catch (err) {
    console.error('[FindIt Matching Exception]:', err);
    return { matches: [], error: err.message || 'Failed to calculate potential matches.' };
  }
}
