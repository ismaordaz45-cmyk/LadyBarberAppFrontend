import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useComprasViewModel } from '../useComprasViewModel';
import { sessionStore } from '../../services/sessionStore';
import { ComprasRepository } from '../../repositories/comprasRepository';
import { guardarComprobanteCompra } from '../../services/comprobanteCompraService';
import { compraPrueba, resumenCompra } from '../../../test/fixtures/compra';
jest.mock('../../repositories/comprasRepository', () => ({ ComprasRepository: { listar: jest.fn(), obtener: jest.fn() } }));
jest.mock('../../services/comprobanteCompraService', () => ({ guardarComprobanteCompra: jest.fn() }));
let renderer: ReactTestRenderer, vm: ReturnType<typeof useComprasViewModel>;
function Hook() { const actual = useComprasViewModel(); React.useEffect(() => { vm = actual; }); return null; }
async function montar() { await act(async () => { renderer = create(<Hook />); }); }
beforeEach(() => {
  jest.resetAllMocks(); sessionStore.setSession('test', 21, 'Cliente', 'CLIENTE');
  jest.mocked(ComprasRepository.listar).mockResolvedValue({ compras: [resumenCompra(9), resumenCompra(8), resumenCompra(7)], siguienteCursor: 7 });
  jest.mocked(ComprasRepository.obtener).mockResolvedValue(compraPrueba);
  jest.mocked(guardarComprobanteCompra).mockResolvedValue({ cancelado: false, carpeta: 'Mis archivos', nombre: 'Compra_9.pdf', uri: 'content://autorizado/pdf' });
});
afterEach(() => { act(() => { renderer?.unmount(); sessionStore.clearSession(); }); });
it('carga tres, agrega más sin duplicados y reinicia la página al filtrar', async () => {
  await montar(); expect(vm.compras).toHaveLength(3);
  jest.mocked(ComprasRepository.listar).mockResolvedValueOnce({ compras: [resumenCompra(6)], siguienteCursor: null });
  await act(async () => { await vm.verMas(); }); expect(vm.compras).toHaveLength(4); expect(vm.hayMas).toBe(false);
  await act(async () => { vm.setFiltro('vigentes'); }); expect(ComprasRepository.listar).toHaveBeenLastCalledWith('vigentes', null); expect(vm.compras).toHaveLength(3);
});
it('una respuesta atrasada de otro filtro o cuenta no reemplaza las compras actuales', async () => {
  let resolver!: (p: Awaited<ReturnType<typeof ComprasRepository.listar>>) => void;
  jest.mocked(ComprasRepository.listar).mockReturnValueOnce(new Promise(r => { resolver = r; }));
  await montar();
  jest.mocked(ComprasRepository.listar).mockResolvedValueOnce({ compras: [], siguienteCursor: null });
  await act(async () => { sessionStore.setSession('otro', 22, 'Otra cuenta', 'CLIENTE'); });
  await act(async () => { resolver({ compras: [resumenCompra(9)], siguienteCursor: null }); }); expect(vm.compras).toHaveLength(0);
});
it('abre vista previa y vuelve a consultar el servidor antes de generar un PDF', async () => {
  await montar(); await act(async () => { await vm.abrir(9); }); expect(vm.compra?.id).toBe(9); expect(vm.modalVisible).toBe(true);
  await act(async () => { await Promise.all([vm.guardarPdf(), vm.guardarPdf()]); });
  expect(ComprasRepository.obtener).toHaveBeenCalledTimes(2); expect(guardarComprobanteCompra).toHaveBeenCalledTimes(1); expect(vm.aviso).toContain('Mis archivos');
});
it('informa errores del selector o guardado sin afirmar que descargó el comprobante', async () => {
  await montar(); await act(async () => { await vm.abrir(9); });
  jest.mocked(guardarComprobanteCompra).mockRejectedValueOnce(new Error('No se pudo guardar el PDF'));
  await act(async () => { await vm.guardarPdf(); }); expect(vm.errorDetalle).toContain('No se pudo guardar'); expect(vm.aviso).toBeNull();
});
it('no envía a impresión un detalle que llega después de cerrar sesión', async () => {
  await montar(); await act(async () => { await vm.abrir(9); });
  let resolver!: (p: typeof compraPrueba) => void;
  jest.mocked(ComprasRepository.obtener).mockReturnValueOnce(new Promise(r => { resolver = r; }));
  let pendiente!: Promise<void>;
  act(() => { pendiente = vm.guardarPdf(); });
  await act(async () => { sessionStore.clearSession(); });
  await act(async () => { resolver(compraPrueba); await pendiente; });
  expect(guardarComprobanteCompra).not.toHaveBeenCalled(); expect(vm.compra).toBeNull();
});
it('muestra error de consulta y permite reintentar sin perder los filtros', async () => {
  jest.mocked(ComprasRepository.listar).mockRejectedValueOnce(new Error('Sin conexión')); await montar();
  expect(vm.error).toBe('Sin conexión');
  await act(async () => { vm.actualizar(); }); expect(vm.error).toBeNull(); expect(vm.compras).toHaveLength(3);
});
