import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { sessionStore } from '../services/sessionStore';
import { CompraDetalle, CompraResumen, FiltroCompras } from '../models/Compra';
import { ComprasRepository } from '../repositories/comprasRepository';
import { guardarComprobanteCompra } from '../services/comprobanteCompraService';

const cuenta = () => sessionStore.isAuthenticated ? sessionStore.userId : null;
const mensaje = (e: unknown) => e instanceof Error ? e.message : 'No se pudieron consultar tus compras. Intenta nuevamente.';
export function useComprasViewModel() {
  const usuarioId = useSyncExternalStore(sessionStore.subscribe, cuenta, () => null);
  const [filtro, cambiarFiltro] = useState<FiltroCompras>('todas');
  const [revision, setRevision] = useState(0);
  const [estado, setEstado] = useState<{ usuarioId: number | null; filtro: FiltroCompras; compras: CompraResumen[]; cursor: number | null }>({ usuarioId: null, filtro: 'todas', compras: [], cursor: null });
  const [cargando, setCargando] = useState(true), [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{ usuarioId: number; compra: CompraDetalle } | null>(null);
  const [modalVisible, setModalVisible] = useState(false), [cargandoDetalle, setCargandoDetalle] = useState(false), [guardando, setGuardando] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null), [aviso, setAviso] = useState<string | null>(null);
  const generacion = useRef(0), peticionDetalle = useRef(0), ocupadaLista = useRef(false), ocupadoPdf = useRef(false);
  const montado = useRef(true);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  useEffect(() => {
    let activo = true;
    const turno = ++generacion.current;
    ocupadaLista.current = true;
    void Promise.resolve().then(async () => {
      if (!activo) return;
      setCargando(true); setError(null); setCargandoMas(false);
      try {
        if (!usuarioId) { setEstado({ usuarioId: null, filtro, compras: [], cursor: null }); return; }
        const pagina = await ComprasRepository.listar(filtro, null);
        if (activo && generacion.current === turno && cuenta() === usuarioId) setEstado({ usuarioId, filtro, compras: pagina.compras, cursor: pagina.siguienteCursor });
      } catch (e) { if (activo) setError(mensaje(e)); }
      finally { if (activo) { ocupadaLista.current = false; setCargando(false); } }
    });
    return () => { activo = false; };
  }, [usuarioId, filtro, revision]);
  useEffect(() => {
    const turno = ++peticionDetalle.current;
    void Promise.resolve().then(() => { if (montado.current && turno === peticionDetalle.current) { setDetalle(null); setModalVisible(false); setErrorDetalle(null); setGuardando(false); } });
  }, [usuarioId]);
  const valida = estado.usuarioId === usuarioId && estado.filtro === filtro;
  const compras = valida ? estado.compras : [];
  const actualizar = useCallback(() => setRevision(r => r + 1), []);
  const abrir = useCallback(async (id: number) => {
    if (!usuarioId) return;
    const turno = ++peticionDetalle.current;
    setModalVisible(true); setCargandoDetalle(true); setDetalle(null); setErrorDetalle(null); setAviso(null);
    try {
      const compra = await ComprasRepository.obtener(id);
      if (montado.current && turno === peticionDetalle.current && cuenta() === usuarioId) setDetalle({ usuarioId, compra });
    } catch (e) { if (montado.current && turno === peticionDetalle.current && cuenta() === usuarioId) setErrorDetalle(mensaje(e)); }
    finally { if (montado.current && turno === peticionDetalle.current) setCargandoDetalle(false); }
  }, [usuarioId]);
  async function verMas() {
    if (!usuarioId || !valida || !estado.cursor || ocupadaLista.current) return;
    const turno = generacion.current;
    ocupadaLista.current = true; setCargandoMas(true); setError(null);
    try {
      const pagina = await ComprasRepository.listar(filtro, estado.cursor);
      if (!pagina.compras.length && pagina.siguienteCursor) throw new Error('No se pudo avanzar en el historial. Actualiza tus compras.');
      if (montado.current && turno === generacion.current && cuenta() === usuarioId) {
        setEstado(prev => ({ ...prev, compras: [...prev.compras, ...pagina.compras.filter(c => !prev.compras.some(p => p.id === c.id))], cursor: pagina.siguienteCursor }));
      }
    } catch (e) { if (montado.current && turno === generacion.current) setError(mensaje(e)); }
    finally { if (montado.current && turno === generacion.current) { ocupadaLista.current = false; setCargandoMas(false); } }
  }
  const compra = detalle?.usuarioId === usuarioId ? detalle.compra : null;
  async function guardarPdf() {
    if (!usuarioId || !compra || ocupadoPdf.current) return;
    const turno = peticionDetalle.current, propietario = usuarioId;
    const vigente = () => montado.current && turno === peticionDetalle.current && cuenta() === propietario;
    ocupadoPdf.current = true; setGuardando(true); setErrorDetalle(null); setAviso(null);
    try {
      const actual = await ComprasRepository.obtener(compra.id);
      if (!vigente()) return;
      setDetalle({ usuarioId: propietario, compra: actual });
      const resultado = await guardarComprobanteCompra(actual, vigente);
      if (vigente() && !resultado.cancelado) setAviso(`Comprobante guardado en ${resultado.carpeta}: ${resultado.nombre}`);
    } catch (e) { if (vigente()) setErrorDetalle(mensaje(e)); }
    finally { ocupadoPdf.current = false; if (vigente()) setGuardando(false); }
  }
  return { filtro, setFiltro: cambiarFiltro, compras, cargando, cargandoMas, error, actualizar, verMas,
    hayMas: valida && estado.cursor !== null, abrir, modalVisible, compra, cargandoDetalle, errorDetalle, aviso, guardando, guardarPdf,
    cerrar: () => { if (ocupadoPdf.current) return; peticionDetalle.current++; setModalVisible(false); setDetalle(null); } };
}
