import { ProductoItem } from '../models/Producto';

/**
 * Repositorio de datos estáticos para Catálogo de Productos (Boutique & Estilo).
 * Replica exactamente los 6 productos de la captura de pantalla.
 */
const PRODUCTOS_ESTATICOS: ProductoItem[] = [
  {
    id: 'prod-1',
    nombre: 'Aceite de Argán & Elixir Sublime',
    categoriaEtiqueta: 'TRATAMIENTO',
    categoria: 'Tratamientos',
    subtitulo: 'Brillo sublime y nutrición profunda',
    precioMXN: 420,
    imagenUrl:
      'https://images.unsplash.com/photo-1608248597359-0a6d59b4f999?auto=format&fit=crop&w=500&q=80',
    badge: {
      texto: '⭐ Top Seller',
      tipo: 'topseller',
    },
    volumen: '100 ml',
    descripcion:
      'Elixir de argán marroquí virgen prensado en frío. Nutre intensamente, sella puntas abiertas y aporta un brillo aterciopelado sin sensación grasa.',
  },
  {
    id: 'prod-2',
    nombre: 'Pomada Matte Lady Barber Pro',
    categoriaEtiqueta: 'POMADAS & STYLING',
    categoria: 'Pomadas & Styling',
    subtitulo: 'Fijación flexible sin residuos',
    precioMXN: 290,
    imagenUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
    volumen: '120 g',
    descripcion:
      'Fórmula base agua de fijación media-firme con acabado mate natural. Fácil de remodelar a lo largo del día y se remueve fácilmente con un solo enjuague.',
  },
  {
    id: 'prod-3',
    nombre: 'Mascarilla Oro Líquido Infusion',
    categoriaEtiqueta: 'TRATAMIENTO',
    categoria: 'Tratamientos',
    subtitulo: 'Reparación térmica intensiva',
    precioMXN: 580,
    imagenUrl:
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=80',
    badge: {
      texto: '250 ml',
      tipo: 'tamano',
    },
    volumen: '250 ml',
    descripcion:
      'Tratamiento acondicionador profundo enriquecido con microcápsulas de queratina hidrolizada y polifenoles. Repara los daños causados por el calor.',
  },
  {
    id: 'prod-4',
    nombre: 'Tónico Estimulante Folículo Activo',
    categoriaEtiqueta: 'TRATAMIENTO',
    categoria: 'Tratamientos',
    subtitulo: 'Fórmula activa anticaída',
    precioMXN: 490,
    imagenUrl:
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=500&q=80',
    volumen: '150 ml',
    descripcion:
      'Loción hidroalcohólica con biotina, cafeína y extracto botánico de romero. Estimula la microcirculación en el cuero cabelludo fortaleciendo la raíz.',
  },
  {
    id: 'prod-5',
    nombre: 'Shampoo Neutro Dermoprotector',
    categoriaEtiqueta: 'CUIDADO DIARIO',
    categoria: 'Cuidado Diario',
    subtitulo: 'Sin sulfatos ni parabenos',
    precioMXN: 360,
    imagenUrl:
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80',
    badge: {
      texto: '500 ml',
      tipo: 'tamano',
    },
    volumen: '500 ml',
    descripcion:
      'Limpieza suave con pH balanceado 5.5 ideal para uso diario o cabellos tratados con colorimetría. Mantiene el cuero cabelludo fresco y equilibrado.',
  },
  {
    id: 'prod-6',
    nombre: 'Peine de Precisión Fibra de Carbón',
    categoriaEtiqueta: 'HERRAMIENTAS',
    categoria: 'Herramientas',
    subtitulo: 'Tecnología antiestática',
    precioMXN: 180,
    imagenUrl:
      'https://images.unsplash.com/photo-1590159763121-7c9ff3149e0a?auto=format&fit=crop&w=500&q=80',
    volumen: '1 pza',
    descripcion:
      'Herramienta profesional fabricada en compuesto de fibra de carbón resistente al calor (hasta 230°C) y a químicos. Dientes redondeados para corte de precisión.',
  },
];

const clonarProducto = (producto: ProductoItem): ProductoItem => ({
  ...producto,
  ...(producto.badge ? { badge: { ...producto.badge } } : {}),
});

export const ProductosRepository = {
  getProductos: async (): Promise<ProductoItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(PRODUCTOS_ESTATICOS.map(clonarProducto)), 50);
    });
  },

  getProductoById: async (id: string): Promise<ProductoItem | undefined> => {
    const producto = PRODUCTOS_ESTATICOS.find((p) => p.id === id);
    return producto ? clonarProducto(producto) : undefined;
  },
};
