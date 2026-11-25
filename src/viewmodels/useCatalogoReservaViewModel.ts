import { useCallback, useMemo, useState } from 'react';
import { ServicioItem } from '../models/Servicio';

const TAMANO_PAGINA = 6;
const normalizarBusqueda = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

/** Presentación del catálogo; la selección y la reserva pertenecen al VM de citas. */
export function useCatalogoReservaViewModel(servicios: ServicioItem[], idsSeleccionados: string[]) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [limite, setLimite] = useState(TAMANO_PAGINA);
  const [detalleServicio, setDetalleServicio] = useState<ServicioItem | null>(null);
  const indice = useMemo(() => servicios.filter(s => s.estaActivo).map(servicio => ({
    servicio, nombre: normalizarBusqueda(servicio.nombre), categoria: servicio.categoria.trim(),
  })), [servicios]);
  const categorias = useMemo(() => [...new Set(indice.map(s => s.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es')), [indice]);
  const filtrados = useMemo(() => {
    const palabras = normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean);
    return indice.filter(s => (categoriaActiva === null || s.categoria === categoriaActiva)
      && palabras.every(palabra => s.nombre.includes(palabra))).map(s => s.servicio);
  }, [indice, categoriaActiva, busqueda]);
  const seleccion = useMemo(() => new Set(idsSeleccionados), [idsSeleccionados]);
  const seleccionados = useMemo(() => indice.filter(s => seleccion.has(s.servicio.id)).map(s => s.servicio), [indice, seleccion]);

  const cambiarBusqueda = useCallback((valor: string) => { setBusqueda(valor); setLimite(TAMANO_PAGINA); }, []);
  const cambiarCategoria = useCallback((valor: string | null) => { setCategoriaActiva(valor); setLimite(TAMANO_PAGINA); }, []);
  const limpiarFiltros = useCallback(() => { setBusqueda(''); setCategoriaActiva(null); setLimite(TAMANO_PAGINA); }, []);
  const abrirDetalle = useCallback((servicio: ServicioItem) => setDetalleServicio(servicio), []);
  const cerrarDetalle = useCallback(() => setDetalleServicio(null), []);
  const serviciosVisibles = useMemo(() => filtrados.slice(0, limite), [filtrados, limite]);
  return {
    busqueda, categoriaActiva, categorias, cambiarBusqueda, cambiarCategoria, limpiarFiltros,
    serviciosVisibles, totalResultados: filtrados.length, totalCatalogo: indice.length,
    hayMas: limite < filtrados.length, seleccionados, seleccion,
    verMas: () => setLimite(actual => Math.min(actual + TAMANO_PAGINA, filtrados.length)),
    detalleServicio, abrirDetalle, cerrarDetalle,
    reiniciar: () => { limpiarFiltros(); setDetalleServicio(null); },
  };
}
