import { apiClient } from '../services/api';

export type NegocioPublico = { id: number; nombre: string; logo: string | null;
  direccion: string | null; ubicacion?: string | null; telefono: string | null; horarioAtencion: string | null };
let cache: { value: NegocioPublico; fecha: number } | null = null;
let pendiente: Promise<NegocioPublico> | null = null;
export const NegocioRepository = {
  async obtener({ actualizar = false }: { actualizar?: boolean } = {}): Promise<NegocioPublico> {
    if (!actualizar && cache && Date.now() - cache.fecha < 300_000) return cache.value;
    if (!pendiente) pendiente = apiClient<NegocioPublico>('/perfil-empresa').then(value => {
      if (!value || typeof value.nombre !== 'string' || !value.nombre.trim()) throw new Error('Perfil del salón no disponible.');
      cache = { value, fecha: Date.now() }; return value;
    }).finally(() => { pendiente = null; });
    return pendiente;
  },
};
