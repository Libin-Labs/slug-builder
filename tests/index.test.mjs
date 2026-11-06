import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildSlug, createSlugAllocator } from '../dist/esm/index.js';
test('compatibility decomposition Unicode letters and combining marks', () => {
  assert.equal(buildSlug('Café ＦＯＯ 東京'), 'cafe-foo-東京');
  assert.equal(buildSlug('Crème & brûlée'), 'creme-brulee');
  assert.equal(buildSlug('東京', { asciiOnly: true }), 'item');
});
test('explicit transliteration and locale', () => {
  assert.equal(buildSlug('æther', { transliterate: (s) => s.replaceAll('æ', 'ae') }), 'aether');
  assert.equal(buildSlug('I', { locale: 'tr' }), 'ı');
  assert.throws(() => buildSlug('x', { transliterate: () => 12 }), TypeError);
});
test('length separator fallback boundaries', () => {
  assert.equal(buildSlug('a b c', { maxLength: 2, fallback: 'x' }), 'a');
  assert.equal(buildSlug('Foo bar', { separator: '_' }), 'foo_bar');
  assert.equal(buildSlug('!!!', { fallback: 'empty' }), 'empty');
  assert.throws(() => buildSlug('', { fallback: 'bad-value' }), TypeError);
  assert.throws(() => buildSlug('', { maxLength: 1 }), TypeError);
});
test('validation controls and bounds', () => {
  assert.throws(() => buildSlug('a\0b'), TypeError);
  assert.throws(() => buildSlug('abc', { maxInput: 2 }), TypeError);
  assert.throws(() => buildSlug('a', { separator: '/' }), TypeError);
  assert.throws(() => buildSlug('a', { maxLength: NaN }), RangeError);
  assert.throws(() => buildSlug('a', { transliterate: () => '\n' }), TypeError);
});
test('allocator collisions against all already allocated names', () => {
  const allocator = createSlugAllocator();
  allocator.reserve('same-2');
  assert.equal(allocator.allocate('Same'), 'same');
  assert.equal(allocator.allocate('same'), 'same-3');
  assert.equal(allocator.size, 3);
  assert.throws(() => allocator.reserve('same'), RangeError);
  assert.throws(() => allocator.reserve('NOT canonical'), TypeError);
});
test('allocator ownership budget and suffix boundary', () => {
  const options = { maxEntries: 2 };
  const allocator = createSlugAllocator(options);
  options.maxEntries = 100;
  assert.equal(allocator.allocate('x'), 'x');
  assert.equal(allocator.allocate('x'), 'x-2');
  assert.throws(() => allocator.allocate('y'), RangeError);
  const tiny = createSlugAllocator({ maxLength: 1, fallback: 'x' });
  tiny.allocate('x');
  assert.throws(() => tiny.allocate('x'), RangeError);
  assert.equal(createSlugAllocator().size, 0);
});
test('CJS surface', () => {
  assert.equal(
    createRequire(import.meta.url)('../dist/cjs/index.js').buildSlug('Hello World'),
    'hello-world',
  );
});
