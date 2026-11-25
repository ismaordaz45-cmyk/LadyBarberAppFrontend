export const paletas = {
  light: { background: '#F8FAFC', surface: '#FFFFFF', surfaceMuted: '#F1F5F9', text: '#1E293B', muted: '#64748B', border: '#E2E8F0', primary: '#1E3A5A', gold: '#886B12', link: '#2563EB' },
  dark: { background: '#0B1220', surface: '#111C2E', surfaceMuted: '#1D2A3D', text: '#E8EEF7', muted: '#B0BED0', border: '#35455D', primary: '#1E3A5A', gold: '#F4D47C', link: '#93C5FD' },
};

// Compatibilidad con la paleta existente: el mismo blanco puede ser superficie
// o texto de un botón. Se transforma según su función, sin invertir imágenes.
const fondos: Record<string, string> = {
  '#fff': '#111C2E', '#ffffff': '#111C2E', 'white': '#111C2E',
  '#f8fafc': '#0B1220', '#f9fafb': '#0B1220', '#fafafa': '#0B1220',
  '#f1f5f9': '#1D2A3D', '#f3f4f6': '#1D2A3D', '#f0f4fa': '#1D2A3D', '#f0f9ff': '#152C43', '#f8f9fa': '#1D2A3D',
  '#f0fdf4': '#13372C', '#dcfce7': '#13372C', '#ecfdf5': '#13372C',
  '#fff8df': '#352E1D', '#fffbeb': '#352E1D', '#fef3c7': '#352E1D', '#fef9c3': '#352E1D',
  '#fffdf5': '#352E1D', '#fff7f7': '#3B202B', 'rgba(255, 255, 255, 0.9)': 'rgba(17, 28, 46, 0.94)',
  '#fef2f2': '#3B202B', '#fff1f2': '#3B202B', '#fee2e2': '#3B202B',
  '#eff6ff': '#172F4D', '#dbeafe': '#172F4D', '#e0f2fe': '#172F4D',
  '#eee': '#35455D', '#eeeeee': '#35455D', '#e5e7eb': '#35455D', '#e2e8f0': '#35455D',
  '#1e293b': '#17243B', '#10172a': '#101B2D',
};
const textos: Record<string, string> = {
  '#000': '#E8EEF7', '#000000': '#E8EEF7', 'black': '#E8EEF7', '#111': '#E8EEF7', '#111111': '#E8EEF7',
  '#111827': '#E8EEF7', '#0f172a': '#E8EEF7', '#10172a': '#E8EEF7', '#1e293b': '#E8EEF7',
  '#1e3a5a': '#E8EEF7', '#1e3a5f': '#E8EEF7', '#1e3a8a': '#C7D8FF', '#334155': '#D2DEEE', '#374151': '#D2DEEE',
  '#475569': '#B0BED0', '#4b5563': '#B0BED0', '#64748b': '#B0BED0', '#6b7280': '#B0BED0',
  '#94a3b8': '#AAB9CB', '#8b9bb4': '#AAB9CB', '#9ca3af': '#AAB9CB',
  '#735b16': '#F4D47C', '#886b12': '#F4D47C', '#d97706': '#F4D47C', '#b45309': '#F4D47C',
  '#854d0e': '#F4D47C', '#92400e': '#F4D47C', '#b47d22': '#F4D47C', '#7f1d1d': '#FCA5A5',
  '#2563eb': '#93C5FD', '#1d4ed8': '#93C5FD', '#3b82f6': '#93C5FD',
  '#b91c1c': '#FCA5A5', '#dc2626': '#FCA5A5', '#ef4444': '#FCA5A5', '#991b1b': '#FCA5A5',
  '#166534': '#86EFAC', '#15803d': '#86EFAC', '#16a34a': '#86EFAC', '#059669': '#6EE7B7', '#10b981': '#6EE7B7',
};
export type RolColor = 'text' | 'background' | 'border';
export function colorApariencia<T>(valor: T, oscuro: boolean, rol: RolColor = 'text'): T {
  if (!oscuro || typeof valor !== 'string') return valor;
  const clave = valor.toLowerCase();
  if (rol === 'background') return (fondos[clave] ?? valor) as T;
  if (rol === 'border') {
    if (['#1e3a5a', '#1e3a5f', '#2563eb'].includes(clave)) return '#93C5FD' as T;
    if (['#fff', '#ffffff', 'white', '#eee', '#eeeeee', '#e5e7eb', '#e2e8f0', '#cbd5e1', '#d1d5db', '#fca5a5', '#fecaca'].includes(clave)) return '#35455D' as T;
    return valor;
  }
  return (textos[clave] ?? valor) as T;
}
