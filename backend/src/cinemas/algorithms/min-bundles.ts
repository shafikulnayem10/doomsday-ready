export interface BundleQuantity {
  size: number;
  quantity: number;
}

export interface BundleResult {
  possible: boolean;
  totalBundles: number;
  bundles: BundleQuantity[];
}

/**
 * Minimum coin change (bundles = coins, group size = amount).
 * minCount[x] = fewest bundles needed to make exactly x seats.
 * lastUsed[x] = the bundle size used last to reach x (for reconstruction).
 */
export function calculateMinBundles(
  bundleSizes: number[],
  groupSize: number,
): BundleResult {
  const minCount: number[] = new Array<number>(groupSize + 1).fill(Infinity);
  const lastUsed: number[] = new Array<number>(groupSize + 1).fill(0);
  minCount[0] = 0; // 0 seats need 0 bundles

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of bundleSizes) {
      if (size <= seats && minCount[seats - size] + 1 < minCount[seats]) {
        minCount[seats] = minCount[seats - size] + 1;
        lastUsed[seats] = size;
      }
    }
  }

  if (minCount[groupSize] === Infinity) {
    return { possible: false, totalBundles: 0, bundles: [] };
  }

  // Walk backwards from groupSize to 0 to count each bundle size
  const counts = new Map<number, number>();
  let remaining = groupSize;
  while (remaining > 0) {
    const size = lastUsed[remaining];
    counts.set(size, (counts.get(size) ?? 0) + 1);
    remaining -= size;
  }

  const bundles = [...counts.entries()]
    .map(([size, quantity]) => ({ size, quantity }))
    .sort((a, b) => b.size - a.size);

  return { possible: true, totalBundles: minCount[groupSize], bundles };
}