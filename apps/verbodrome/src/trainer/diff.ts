/**
 * Split `a` into [before, differing, after] relative to `b`, for highlighting
 * what the learner got wrong. Returns no highlight when the strings already
 * differ inside the first `protect` characters (the subject pronoun), where a
 * highlight would just mark the whole phrase. A difference at the very start
 * is only marked when it is a slip of a letter or two ("ecris !" for "écris !").
 */
export function diff(a: string, b: string | null, protect = 0): [string, string, string] {
  if (!b || a === b) return [a, '', ''];
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  if (prefix < protect) return [a, '', ''];
  let suffix = 0;
  while (suffix < a.length - prefix && suffix < b.length - prefix
    && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
  const slip = a.length - prefix - suffix <= 2 && b.length - prefix - suffix <= 2;
  if (prefix === 0 && !(protect === 0 && slip)) return [a, '', ''];
  return [a.slice(0, prefix), a.slice(prefix, a.length - suffix), a.slice(a.length - suffix)];
}

/** Length of the leading "que "/"qu'" and subject pronoun of a French phrase. */
export function subjectLength(text: string, hasSubject: boolean): number {
  if (!hasSubject) return 0;
  return /^(que |qu')?[^ ']+[ ']/.exec(text)?.[0].length ?? 0;
}
