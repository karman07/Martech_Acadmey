import type { Decimal } from '@prisma/client/runtime/library';

/** The admin-approved, student-facing price: the teacher's price marked up by their margin. */
export function computeListPrice(
  price: Decimal | number,
  marginPercent: number,
): number {
  const base = typeof price === 'number' ? price : price.toNumber();
  return Math.round(base * (1 + marginPercent / 100) * 100) / 100;
}

export function discounted(listPrice: number, discountPercent: number): number {
  return Math.round(listPrice * (1 - discountPercent / 100) * 100) / 100;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
