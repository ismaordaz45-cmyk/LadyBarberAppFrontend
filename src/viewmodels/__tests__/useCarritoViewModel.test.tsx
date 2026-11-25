import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useCarritoViewModel } from '../useCarritoViewModel';
import { CarritoRepository } from '../../repositories/carritoRepository';
import { sessionStore } from '../../services/sessionStore';
import { ProductoItem } from '../../models/Producto';
import { Pedido } from '../../models/Pedido';
jest.mock('../../repositories/carritoRepository', () => {
  const repo = { leer: jest.fn(), guardar: jest.fn(), leerEstado: jest.fn(), guardarEstado: jest.fn() };
  repo.leerEstado.mockImplementation(async (id: number) => ({ items: await repo.leer(id), pedidosAplicados: [] }));
  repo.guardarEstado.mockImplementation((id: number, estado: { items: unknown }) => repo.guardar(id, estado.items));
  return { CarritoRepository: repo };
});
const producto: ProductoItem = { id: '7', nombre: 'Aceite', categoria: 'Productos', categoriaEtiqueta: 'PRODUCTO', subtitulo: '', precioMXN: 12.35, descripcion: '', imagenUrl: '', stockActual: 3 };
const leer = jest.mocked(CarritoRepository.leer);
const guardar = jest.mocked(CarritoRepository.guardar);
let renderer: ReactTestRenderer;
let vm: ReturnType<typeof useCarritoViewModel>;
function Hook({ productos = [producto] }: { productos?: ProductoItem[] }) {
  const value = useCarritoViewModel(productos);
  React.useEffect(() => { vm = value; });
  return null;
}
async function montar() { await act(async () => { renderer = create(<Hook />); }); }
it('solo confirma un agregado después de persistirlo y no anuncia éxito si falla guardar', async () => {
  await montar();
  expect(vm.ultimoAgregado).toBeNull();
  let resolver!: () => void;
  guardar.mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
  let pendiente!: Promise<boolean>;
  act(() => { pendiente = vm.agregar(producto); });
  expect(vm.ultimoAgregado).toBeNull();
  await act(async () => { resolver(); await pendiente; });
  expect(vm.ultimoAgregado?.nombre).toBe('Aceite');
  guardar.mockRejectedValueOnce(new Error('Sin espacio'));
  await act(async () => { expect(await vm.agregar(producto)).toBe(false); });
  expect(vm.ultimoAgregado).toBeNull();
  expect(vm.error).toContain('no pudimos guardarlo');
});
it('no muestra el agregado de una cuenta si el guardado termina después de cambiar de sesión', async () => {
  await montar();
  let resolver!: () => void;
  guardar.mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
  let pendiente!: Promise<boolean>;
  act(() => { pendiente = vm.agregar(producto); });
  await act(async () => { sessionStore.setSession('otra', 22, 'Otra cuenta', 'CLIENTE'); });
  await act(async () => { resolver(); await pendiente; });
  expect(vm.ultimoAgregado).toBeNull();
});
beforeEach(() => { jest.clearAllMocks(); leer.mockResolvedValue([]); guardar.mockResolvedValue(); sessionStore.setSession('test', 10, 'Cliente', 'CLIENTE'); });
afterEach(() => { act(() => { renderer?.unmount(); sessionStore.clearSession(); }); });
it('recupera el carrito de la cuenta y suma clics rápidos sin perder cantidades', async () => {
  await montar();
  await act(async () => { vm.agregar(producto); vm.agregar(producto); });
  expect(vm.cantidad).toBe(2); expect(vm.total).toBe(24.7);
  expect(guardar).toHaveBeenLastCalledWith(10, [{ productoId: '7', cantidad: 2 }]);
});
it('impide cantidades superiores al stock y productos sin disponibilidad', async () => {
  await montar();
  await act(async () => { vm.cambiar(producto, 4); });
  expect(vm.cantidad).toBe(0); expect(vm.error).toContain('existencias'); expect(guardar).not.toHaveBeenCalled();
});
it('refleja precios actuales y advierte si el inventario disminuyó o desapareció', async () => {
  leer.mockResolvedValue([{ productoId: '7', cantidad: 3 }]); await montar();
  act(() => { renderer.update(<Hook productos={[{ ...producto, precioMXN: 20, stockActual: 1 }]} />); });
  expect(vm.lineas[0].requiereAjuste).toBe(true); expect(vm.total).toBe(60);
  act(() => { renderer.update(<Hook productos={[]} />); });
  expect(vm.lineas[0].producto).toBeUndefined(); expect(vm.lineas[0].requiereAjuste).toBe(true);
  await act(async () => { vm.quitar('7'); }); expect(vm.cantidad).toBe(0);
});
it('oculta el carrito al cerrar sesión y recupera solo el de la nueva cuenta', async () => {
  leer.mockResolvedValueOnce([{ productoId: '7', cantidad: 2 }]).mockResolvedValueOnce([]);
  await montar(); expect(vm.cantidad).toBe(2);
  await act(async () => { sessionStore.clearSession(); });
  expect(vm.cantidad).toBe(0); expect(vm.sinSesion).toBe(true);
  await act(async () => { sessionStore.setSession('otra', 20, 'Otra', 'CLIENTE'); });
  expect(vm.cantidad).toBe(0); expect(leer).toHaveBeenLastCalledWith(20);
  await act(async () => { vm.agregar(producto); });
  expect(guardar).toHaveBeenLastCalledWith(20, [{ productoId: '7', cantidad: 1 }]);
});
it('descarta una carga anterior que termina después del cambio de cuenta', async () => {
  let resolver!: (items: { productoId: string; cantidad: number }[]) => void;
  leer.mockReturnValueOnce(new Promise(resolve => { resolver = resolve; })).mockResolvedValueOnce([]);
  await montar();
  await act(async () => { sessionStore.setSession('nueva', 30, 'Nueva', 'CLIENTE'); });
  await act(async () => { resolver([{ productoId: '7', cantidad: 3 }]); });
  expect(vm.cantidad).toBe(0); expect(vm.listo).toBe(true);
});
it('informa error al guardar, conserva el carrito y permite reintentar', async () => {
  guardar.mockRejectedValueOnce(new Error('Disco lleno'));
  await montar(); await act(async () => { vm.agregar(producto); });
  expect(vm.error).toContain('dispositivo'); expect(vm.cantidad).toBe(1);
  await act(async () => { vm.reintentar(); }); expect(vm.error).toBeNull(); expect(vm.cantidad).toBe(1);
});
it('no sobrescribe un carrito si no se pudo leer y permite recuperar después', async () => {
  leer.mockRejectedValueOnce(new Error('Archivo inaccesible')).mockResolvedValueOnce([{ productoId: '7', cantidad: 2 }]);
  await montar(); expect(vm.listo).toBe(false);
  await act(async () => { vm.agregar(producto); }); expect(guardar).not.toHaveBeenCalled();
  await act(async () => { vm.reintentar(); }); expect(vm.cantidad).toBe(2); expect(vm.listo).toBe(true);
});
it('serializa escrituras y la última cantidad es la persistida', async () => {
  let resolver!: () => void;
  guardar.mockReturnValueOnce(new Promise<void>(resolve => { resolver = resolve; }));
  await montar(); await act(async () => { vm.agregar(producto); vm.agregar(producto); vm.vaciar(); });
  expect(guardar).toHaveBeenCalledTimes(1);
  await act(async () => { resolver(); });
  expect(guardar).toHaveBeenLastCalledWith(10, []); expect(vm.cantidad).toBe(0);
});

it('retira solo unidades compradas y no vuelve a descontarlas al repetir la consulta', async () => {
  leer.mockResolvedValue([{ productoId: '7', cantidad: 3 }, { productoId: '8', cantidad: 1 }]);
  await montar();
  const pedido = { id: 99, compraConfirmada: true, pagoAprobado: true, items: [{ insumoId: 7, cantidad: 2 }] } as Pedido;
  await act(async () => { await vm.aplicarPedido(pedido); });
  expect(vm.cantidad).toBe(2); expect(vm.lineas.find(i => i.productoId === '7')?.cantidad).toBe(1);
  await act(async () => { await vm.aplicarPedido(pedido); }); expect(vm.cantidad).toBe(2);
});
it('un pago pendiente no modifica el carrito y restaura el registro de pedidos ya aplicados', async () => {
  jest.mocked(CarritoRepository.leerEstado).mockResolvedValueOnce({ items: [{ productoId: '7', cantidad: 3 }], pedidosAplicados: [99] });
  await montar();
  await act(async () => { await vm.aplicarPedido({ id: 88, compraConfirmada: false, pagoAprobado: false, items: [] } as unknown as Pedido); });
  expect(vm.cantidad).toBe(3);
  await act(async () => { await vm.aplicarPedido({ id: 99, compraConfirmada: true, pagoAprobado: true, items: [{ insumoId: 7, cantidad: 2 }] } as Pedido); });
  expect(vm.cantidad).toBe(3);
});
