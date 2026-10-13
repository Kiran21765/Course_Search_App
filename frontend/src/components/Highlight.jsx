const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wraps the part of `text` that matches the search in <mark>.
 * Uses the same rules as the server: a word of 1 or 2 letters must start a word,
 * a word of 3 or more letters can match anywhere.
 */
export default function Highlight({ text, query }) {
  const words = (query || '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!text || words.length === 0) return <>{text}</>;

  const ranges = [];
  for (const word of words) {
    const pattern = word.length < 3 ? `(?<=^|[\\s,])${escapeRegex(word)}` : escapeRegex(word);
    const re = new RegExp(pattern, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      ranges.push([m.index, m.index + m[0].length]);
      if (m[0].length === 0) re.lastIndex += 1;
    }
  }
  if (ranges.length === 0) return <>{text}</>;

  // merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const parts = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<mark key={i}>{text.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
