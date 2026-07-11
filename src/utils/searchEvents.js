/**
 * Fuzzy event search — prioritizes text similarity, then date proximity.
 * Normalizes: trims, lowercases, removes accents/diacritics and commas.
 */

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,]/g, '');
}

function textScore(eventName, query) {
  const name = normalize(eventName);
  const q = normalize(query);
  if (!q) return 0;

  // Exact match
  if (name === q) return 100;

  // Contains full query
  if (name.includes(q)) {
    // Bonus for starting with query
    if (name.startsWith(q)) return 90;
    return 80;
  }

  // Check if all query words appear in the name
  const qWords = q.split(/\s+/).filter(Boolean);
  const allWordsMatch = qWords.every((w) => name.includes(w));
  if (allWordsMatch) return 70;

  // Partial word matches — count how many query chars appear in sequence
  let matchLen = 0;
  let nameIdx = 0;
  for (let i = 0; i < q.length; i++) {
    const found = name.indexOf(q[i], nameIdx);
    if (found !== -1) {
      matchLen++;
      nameIdx = found + 1;
    }
  }
  const ratio = matchLen / q.length;
  if (ratio >= 0.7) return Math.round(ratio * 60);

  return 0;
}

/**
 * Search events and return sorted results.
 * @param {Array} allEvents - events from BadiYearContext (with gregDate, event, desc)
 * @param {string} query - user search input
 * @param {Date} referenceDate - today or current view date for proximity scoring
 * @returns {Array} sorted results with { event, gregDate, score }
 */
export function searchEvents(allEvents, query, referenceDate) {
  if (!query || !query.trim()) return [];

  const refTime = referenceDate.getTime();
  const results = [];

  for (const ev of allEvents) {
    const name = ev.event || '';
    const score = textScore(name, query);
    if (score > 0) {
      const daysDiff = Math.abs(ev.gregDate - refTime) / 86400000;
      // Date proximity bonus: max 10 points, decays over 365 days
      const dateBonus = Math.max(0, 10 - (daysDiff / 365) * 10);
      results.push({
        ...ev,
        score: score + dateBonus,
        name,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}
