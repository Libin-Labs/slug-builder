# @lp-labs/slug-builder

Unicode-normalized configurable slug creation and bounded collision-aware local allocation.

Standalone original implementation; zero runtime, peer, or sibling-package dependencies. Node.js 18+, ESM and CommonJS with separate declaration trees. No browser globals are accessed at import time; compiled runtime uses only standard JavaScript APIs.

## Install

```sh
npm install @lp-labs/slug-builder
```

## Quick start

```js
import { buildSlug, createSlugAllocator } from '@lp-labs/slug-builder';
console.log(buildSlug('Café & 東京')); // cafe-東京
const slugs = createSlugAllocator();
console.log(slugs.allocate('Café'), slugs.allocate('Cafe')); // cafe cafe-2
```

CommonJS exposes the same named exports:

```cjs
const api = require('@lp-labs/slug-builder');
```

## Customization

```js
import { buildSlug, createSlugAllocator } from '@lp-labs/slug-builder';
console.log(buildSlug('æther', { asciiOnly: true, transliterate: (s) => s.replaceAll('æ', 'ae') }));
const slugs = createSlugAllocator({ separator: '_', maxLength: 20, maxEntries: 10 });
slugs.reserve('title_2');
console.log(slugs.allocate('title'), slugs.allocate('title')); // title title_3
```

## Semantics, limits and errors

`buildSlug` applies NFKD, optional caller `transliterate(normalizedText)`, removal of combining marks, then locale lowercase (default `en`). It joins Unicode letter/number runs with `separator` (`-` default or `_`). `asciiOnly: true` keeps only ASCII a-z/0-9; no built-in language dictionary, transliteration table, or hidden corpus is included. This is lossy normalization, not an identifier/security equivalence algorithm.

`maxLength` defaults to 100 code points: truncate explicitly at that boundary, trim a trailing separator, then use `fallback` if empty. Fallback defaults to `item` and must be nonempty lowercase ASCII alphanumeric and fit maxLength; when using a smaller maxLength, supply a shorter fallback. `maxInput` defaults to 100,000 UTF-16 units and also bounds callback output. Limits must be positive safe integers. Controls/DEL, bad separators, nonstring callback outputs and invalid fallbacks throw TypeError; limits throw RangeError. Callback exceptions propagate.

`createSlugAllocator` snapshots options, stores a private Set and exposes `allocate`, `reserve`, and readonly `size`. `reserve` requires a canonical slug not already in the set. Allocation starts with the base, then tries separator+2, +3, etc., shortening the base to fit. All previously reserved/generated names are checked, including names with suffixes. No room for a prefix/suffix, duplicate reservations, or exhausted `maxEntries` (10,000 default) throw RangeError. Failed allocations do not insert a value. Uniqueness is strictly local to one in-memory allocator; it is neither durable nor coordinated across processes. A stateful transliterator is the caller's responsibility.

Slug work/storage is O(n) excluding callback and Unicode runtime costs. Allocation may probe O(k) suffixes for k colliding/reserved names and stores O(total allocated text).

## Complete public declaration API

The following is the complete public ESM declaration surface; CommonJS has matching declarations and runtime exports. Optional properties are omitted rather than supplied as undefined under exactOptionalPropertyTypes.

```ts
export interface SlugOptions {
  separator?: '-' | '_';
  locale?: string;
  transliterate?: (normalized: string) => string;
  asciiOnly?: boolean;
  maxLength?: number;
  maxInput?: number;
  fallback?: string;
}
export declare function buildSlug(text: string, options?: SlugOptions): string;
export interface SlugAllocator {
  allocate(text: string): string;
  reserve(slug: string): void;
  readonly size: number;
}
export interface AllocatorOptions extends SlugOptions {
  maxEntries?: number;
}
/** Unique within this allocator, not a global or persistent registry. */
export declare function createSlugAllocator(options?: AllocatorOptions): SlugAllocator;
```

## Development and verification

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

The offline command requires the dev tools already present in npm's cache. TypeScript ^5.9.3 and Prettier ^3.6.2 are dev-only. Build targets ES2022 with strict NodeNext declarations, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noUnused checks, ES2022/DOM libs and no ambient type packages. Runtime tests import the ESM distribution directly and check CommonJS parity. Bare-package .mts/.cts consumer tests include negative type assertions. Published files are only dist, this README, LICENSE and package.json. No publication is performed by tests.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
