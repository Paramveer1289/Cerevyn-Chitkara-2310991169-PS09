// Seeded PRNG and array shuffling.

/**
 * Creates a seeded 32-bit PRNG using mulberry32.
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let s = seed >>> 0;

  return function next() {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = (z ^ (z >>> 14)) >>> 0;
    return z / 0x100000000;
  };
}

/**
 * Shuffles an array in-place using Fisher-Yates.
 * @param {Array} arr
 * @param {() => number} randFn
 * @returns {Array}
 */
export function fisherYatesShuffle(arr, randFn) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
