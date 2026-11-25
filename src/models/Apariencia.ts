export type ModoApariencia = 'light' | 'dark' | 'system';
export const esModoApariencia = (value: unknown): value is ModoApariencia =>
  value === 'light' || value === 'dark' || value === 'system';
