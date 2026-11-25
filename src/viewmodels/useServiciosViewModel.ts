import { useState, useEffect, useMemo } from 'react';
import { ServicioItem, CategoriaServicio } from '../models/Servicio';
import { ServiciosRepository } from '../repositories/serviciosRepository';

export const useServiciosViewModel = () => {
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaServicio>('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioItem | null>(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancel = false;
    const cargarServicios = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ServiciosRepository.getServicios({ categoriaGenerica: false });
        if (!cancel) {
          setServicios(data);
        }
      } catch (e: any) {
        if (!cancel) {
          setError(e?.message ?? 'No se pudieron cargar los servicios');
        }
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };

    cargarServicios();
    return () => {
      cancel = true;
    };
  }, [revision]);

  // Categorías derivadas dinámicamente de los datos reales del API
  const categoriasDisponibles: CategoriaServicio[] = useMemo(() => {
    const set = new Set<string>();
    servicios.forEach((s) => {
      if (s.categoria && s.categoria.trim()) {
        set.add(s.categoria.trim());
      }
    });
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((s) => {
      const cumpleCategoria =
        categoriaActiva === 'Todos' || s.categoria === categoriaActiva;

      const q = busqueda.trim().toLowerCase();
      const cumpleBusqueda =
        !q ||
        s.nombre.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q);

      return cumpleCategoria && cumpleBusqueda;
    });
  }, [servicios, categoriaActiva, busqueda]);

  const abrirDetalle = (servicio: ServicioItem) => {
    setServicioSeleccionado(servicio);
    setModalDetalleVisible(true);
  };

  const cerrarDetalle = () => {
    setModalDetalleVisible(false);
    setServicioSeleccionado(null);
  };

  return {
    isLoading,
    error,
    categoriaActiva,
    setCategoriaActiva: (value: CategoriaServicio) => { setCategoriaActiva(value); setPagina(1); },
    busqueda,
    setBusqueda: (value: string) => { setBusqueda(value); setPagina(1); },
    categoriasDisponibles,
    servicios: serviciosFiltrados.slice((pagina - 1) * 6, pagina * 6),
    pagina,
    totalPaginas: Math.max(1, Math.ceil(serviciosFiltrados.length / 6)),
    cambiarPagina: (value: number) => setPagina(Math.max(1, Math.min(value, Math.max(1, Math.ceil(serviciosFiltrados.length / 6))))),
    reintentar: () => setRevision(value => value + 1),
    totalServicios: serviciosFiltrados.length,
    servicioSeleccionado,
    modalDetalleVisible,
    abrirDetalle,
    cerrarDetalle,
  };
};
