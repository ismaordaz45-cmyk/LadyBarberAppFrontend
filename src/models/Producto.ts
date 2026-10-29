export type CategoriaProducto =
  | 'Todos'
  | 'Tratamientos'
  | 'Pomadas & Styling'
  | 'Cuidado Diario'
  | 'Herramientas';

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
}
