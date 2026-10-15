/** Up to two initials for an avatar: first and last word ("Ana López" → "AL"). */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((word) => Array.from(word ?? '')[0]?.toUpperCase() ?? '').join('');
}
