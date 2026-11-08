export type CategoriaProducto =
  | 'Todos'
  | 'Productos'
  | 'Tratamientos'
  | 'Pomadas & Styling'
  | 'Cuidado Diario'
  | 'Herramientas';

export interface ProductoAPI {
  id: number | string;
  nombre: string;
  descripcion?: string | null;
  unidad?: string | null;
  stockActual?: number | string | null;
  stockMinimo?: number | string | null;
  precio?: number | string | null;
  estaActivo?: number | boolean;
  imagen?: string | null;
}

export interface ProductoItem {
  id: string;
  nombre: string;
  categoriaEtiqueta: string;
  categoria: CategoriaProducto;
  subtitulo: string;
  precioMXN: number;
  imagenUrl: string;
  badge?: {
    texto: string;
    tipo: 'topseller' | 'tamano';
  };
  volumen?: string;
  descripcion: string;
  stockActual?: number;
}
