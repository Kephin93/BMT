export function groupCartByDate<T extends { pickupDate: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(item.pickupDate) ?? [];
    group.push(item);
    groups.set(item.pickupDate, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b))
    .map(([pickupDate, items]) => ({ pickupDate, items }));
}
