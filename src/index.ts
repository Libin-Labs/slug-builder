export interface SlugOptions {
  separator?: '-' | '_';
  locale?: string;
  transliterate?: (normalized: string) => string;
  asciiOnly?: boolean;
  maxLength?: number;
  maxInput?: number;
  fallback?: string;
}
function positive(n: number): void {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('Expected positive integer budget.');
}
export function buildSlug(text: string, options: SlugOptions = {}): string {
  const {
    separator = '-',
    locale = 'en',
    asciiOnly = false,
    maxLength = 100,
    maxInput = 100_000,
    fallback = 'item',
  } = options;
  positive(maxLength);
  positive(maxInput);
  if (separator !== '-' && separator !== '_') throw new TypeError('Invalid separator.');
  if (typeof text !== 'string' || text.length > maxInput || /[\u0000-\u001f\u007f]/u.test(text))
    throw new TypeError('Invalid or oversized input.');
  if (typeof fallback !== 'string' || !/^[a-z0-9]+$/u.test(fallback) || fallback.length > maxLength)
    throw new TypeError('Fallback must be bounded lowercase ASCII alphanumeric.');
  let value = text.normalize('NFKD');
  if (options.transliterate) value = options.transliterate(value);
  if (typeof value !== 'string' || value.length > maxInput || /[\u0000-\u001f\u007f]/u.test(value))
    throw new TypeError('Invalid transliteration output.');
  value = value.replace(/\p{M}/gu, '').toLocaleLowerCase(locale);
  const words = value.match(asciiOnly ? /[a-z0-9]+/gu : /[\p{L}\p{N}]+/gu) ?? [];
  const slug = [...words.join(separator)]
    .slice(0, maxLength)
    .join('')
    .replace(/[-_]+$/u, '');
  return slug || fallback;
}
export interface SlugAllocator {
  allocate(text: string): string;
  reserve(slug: string): void;
  readonly size: number;
}
export interface AllocatorOptions extends SlugOptions {
  maxEntries?: number;
}
/** Unique within this allocator, not a global or persistent registry. */
export function createSlugAllocator(options: AllocatorOptions = {}): SlugAllocator {
  const captured = { ...options };
  const limit = captured.maxEntries ?? 10_000;
  positive(limit);
  buildSlug('', captured);
  const used = new Set<string>();
  const reserve = (slug: string): void => {
    if (typeof slug !== 'string' || buildSlug(slug, captured) !== slug)
      throw new TypeError('Not a canonical slug.');
    if (used.has(slug)) throw new RangeError('Slug already reserved.');
    if (used.size >= limit) throw new RangeError('Entry budget exceeded.');
    used.add(slug);
  };
  return {
    allocate(text) {
      if (used.size >= limit) throw new RangeError('Entry budget exceeded.');
      const base = buildSlug(text, captured);
      let candidate = base;
      const max = captured.maxLength ?? 100;
      for (let n = 2; used.has(candidate); n++) {
        const suffix = `${captured.separator ?? '-'}${n}`;
        if (suffix.length >= max) throw new RangeError('No room for collision suffix.');
        const prefix = [...base]
          .slice(0, max - suffix.length)
          .join('')
          .replace(/[-_]+$/u, '');
        if (!prefix) throw new RangeError('No room for collision prefix.');
        candidate = prefix + suffix;
      }
      used.add(candidate);
      return candidate;
    },
    reserve,
    get size() {
      return used.size;
    },
  };
}
