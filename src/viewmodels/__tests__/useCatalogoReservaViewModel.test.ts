import React from 'react';
import { act, create } from 'react-test-renderer';
import { ServicioItem } from '../../models/Servicio';
import { useCatalogoReservaViewModel } from '../useCatalogoReservaViewModel';

const servicio = (i: number): ServicioItem => ({ id: String(i), nombre: `Servicio ${i}`, descripcion: 'Descripción',
  precioMXN: 120, duracionMin: 45, categoria: i % 2 ? 'Categoría real B' : 'Categoría real A', imagenUrl: null, estaActivo: true });
let renderer: any;
async function renderHook(datos: ServicioItem[], seleccion: string[] = []) {
  const result = {} as { current: ReturnType<typeof useCatalogoReservaViewModel> };
  function Component() { result.current = useCatalogoReservaViewModel(datos, seleccion); return null; }
  await act(async () => { renderer = create(React.createElement(Component)); });
  return result;
}
describe('Catálogo para reservar', () => {
  afterEach(() => act(() => renderer?.unmount()));
  it('limita 200 servicios a seis y amplía de seis en seis sin modificar el catálogo', async () => {
    const datos = Array.from({ length: 200 }, (_, i) => servicio(i));
    const result = await renderHook(datos);
    expect(result.current.serviciosVisibles).toHaveLength(6);
    expect(result.current.totalResultados).toBe(200);
    await act(async () => { result.current.verMas(); });
    expect(result.current.serviciosVisibles).toHaveLength(12);
    expect(datos).toHaveLength(200);
    await act(async () => { result.current.cambiarCategoria('Categoría real B'); });
    expect(result.current.serviciosVisibles).toHaveLength(6);
    expect(result.current.totalResultados).toBe(100);
    await act(async () => { result.current.cambiarBusqueda('Servicio 199'); });
    expect(result.current.serviciosVisibles.map(s => s.id)).toEqual(['199']);
    expect(result.current.hayMas).toBe(false);
  });
  it('combina búsqueda por nombre sin acentos y categoría, conservando las selecciones ocultas', async () => {
    const datos = [{ ...servicio(1), nombre: 'Córte clásico', categoria: 'Cabello' }, { ...servicio(2), nombre: 'Corte infantil', categoria: 'Infantil' }];
    const result = await renderHook(datos, ['1', '2']);
    await act(async () => { result.current.cambiarBusqueda('CLASICO corte'); result.current.cambiarCategoria('Cabello'); });
    expect(result.current.serviciosVisibles.map(s => s.id)).toEqual(['1']);
    expect(result.current.seleccionados.map(s => s.id)).toEqual(['1', '2']);
    await act(async () => { result.current.cambiarCategoria('Infantil'); });
    expect(result.current.serviciosVisibles).toEqual([]);
    await act(async () => { result.current.limpiarFiltros(); });
    expect(result.current.serviciosVisibles).toHaveLength(2);
    expect(result.current.seleccion.size).toBe(2);
  });
  it('deriva categorías sin inventar nombres y excluye servicios inactivos', async () => {
    const result = await renderHook([
      { ...servicio(1), categoria: '' }, { ...servicio(2), categoria: '  Cabello  ' },
      { ...servicio(3), categoria: 'Cabello' }, { ...servicio(4), categoria: 'Inactiva', estaActivo: false },
    ]);
    expect(result.current.categorias).toEqual(['Cabello']);
    expect(result.current.totalCatalogo).toBe(3);
    await act(async () => { result.current.cambiarCategoria('Cabello'); });
    expect(result.current.serviciosVisibles.map(s => s.id)).toEqual(['2', '3']);
  });
  it('reinicia filtros y detalle al comenzar una reserva nueva', async () => {
    const result = await renderHook([servicio(1)]);
    await act(async () => { result.current.cambiarBusqueda('Servicio'); result.current.abrirDetalle(servicio(1)); });
    expect(result.current.detalleServicio?.id).toBe('1');
    await act(async () => { result.current.reiniciar(); });
    expect(result.current.busqueda).toBe('');
    expect(result.current.categoriaActiva).toBeNull();
    expect(result.current.detalleServicio).toBeNull();
  });
});
