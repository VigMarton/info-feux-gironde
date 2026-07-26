/** Groups items by category while preserving first-seen category order. */
export function groupByCategory<T extends { category: string }>(
  items: readonly T[],
): Array<{ category: string; items: T[] }> {
  const order: string[] = [];
  const byCategory = new Map<string, T[]>();

  for (const item of items) {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, []);
      order.push(item.category);
    }
    byCategory.get(item.category)?.push(item);
  }

  return order.map((category) => ({ category, items: byCategory.get(category) ?? [] }));
}
