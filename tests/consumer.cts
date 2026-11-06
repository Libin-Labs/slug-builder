import {
  buildSlug,
  createSlugAllocator,
  type SlugOptions,
  type AllocatorOptions,
  type SlugAllocator,
} from '@lp-labs/slug-builder';
const options: SlugOptions = { transliterate: (s) => s, separator: '-' };
const allocation: AllocatorOptions = { ...options, maxEntries: 10 };
const allocator: SlugAllocator = createSlugAllocator(allocation);
const value: string = allocator.allocate(buildSlug('Hello', options));
// @ts-expect-error only two separator choices
buildSlug('x', { separator: '/' });
// @ts-expect-error callback must return text
buildSlug('x', { transliterate: () => 1 });
void value;
