/**
 * Shape que devuelve GET /api/servicios del backend.
 * Campos exactos según catalogoRepository.getServicios() y la tabla `servicio`.
 */
export interface ServicioAPI {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | string;
  duracion: number;          // duracionMinutos aliased as duracion
  categoria: string | null;
  imagenUrl: string | null;
  estaActivo: number;        // 1 = activo
}

/**
 * Modelo normalizado para la UI del móvil.
 * Se construye a partir de ServicioAPI en el repositorio.
 */
export interface ServicioItem {
  id: string;
  nombre: string;
  descripcion: string;
  precioMXN: number;
  duracionMin: number;
  categoria: string;         // Dinámico (viene del API, no enum fijo)
  imagenUrl: string | null;  // Campo crudo del backend (se resuelve en la vista)
  estaActivo: boolean;
}

/**
 * Categorías disponibles para filtros.
 * Se derivarán dinámicamente de los servicios cargados + opción "Todos".
 */
export type CategoriaServicio = string;
