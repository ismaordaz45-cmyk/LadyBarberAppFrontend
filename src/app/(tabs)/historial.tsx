import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EncabezadoModulo } from '../../components/compartidos/EncabezadoModulo';
import { useHistorialViewModel } from '../../viewmodels/useHistorialViewModel';
import { ListaCitas } from '../../components/citas/ListaCitas';

export default function HistorialScreen() {
  const apariencia = useAparienciaViewModel();
  const vm = useHistorialViewModel();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: apariencia.color('#F8FAFC', 'background') }}>
    <ListaCitas historial vm={vm} encabezado={<EncabezadoModulo titulo="Tu historial de citas" />} />
  </SafeAreaView>;
}
