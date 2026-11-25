import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ProductoItem } from '../../models/Producto';
import { limiteProducto } from '../../models/Carrito';
import { useThemedStyles } from '../../hooks/use-themed-styles';
import { useAparienciaViewModel } from '../../viewmodels/useAparienciaViewModel';
import { Text } from '../compartidos/TextoApp';
import { ImagenProducto } from './ImagenProducto';
import { AvisoCarrito, ProductoAgregado } from './AvisoCarrito';

interface Props {
  producto: ProductoItem | null;
  cantidad: number;
  bloqueado: boolean;
  onClose: () => void;
  onAgregar: (producto: ProductoItem) => void;
  agregado?: ProductoAgregado | null;
  onVerCarrito?: () => void;
}

export function ProductoDetalleModal({ producto, cantidad, bloqueado, onClose, onAgregar, agregado = null, onVerCarrito }: Props) {
  const styles = useThemedStyles(baseStyles);
  const apariencia = useAparienciaViewModel();
  if (!producto) return null;
  const limite = limiteProducto(producto);
  const disabled = bloqueado || cantidad >= limite;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={styles.backdrop}>
      <View style={styles.card} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PRODUCTOS DEL SALÓN</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar producto" onPress={onClose} style={styles.close}>
            <Feather name="x" size={22} color={apariencia.colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <ImagenProducto uri={producto.imagenUrl} nombre={producto.nombre} style={styles.image} resizeMode="contain" />
          {!!producto.categoriaEtiqueta && <Text style={styles.category}>{producto.categoriaEtiqueta}</Text>}
          <Text accessibilityRole="header" style={styles.title}>{producto.nombre}</Text>
          {!!producto.subtitulo && <Text style={styles.description}>{producto.subtitulo}</Text>}
          <Text style={styles.price}>${producto.precioMXN.toFixed(2)} MXN</Text>
          <Text style={styles.stock}>{limite > 0 ? `${producto.stockActual} unidades disponibles` : 'No disponible para agregar'}</Text>
          <Text style={styles.label}>Acerca del producto</Text>
          <Text style={styles.description}>{producto.descripcion || 'Este producto no tiene una descripción disponible.'}</Text>
          <View style={styles.pickup}><Feather name="shopping-bag" size={18} color={apariencia.colors.text} />
            <Text style={styles.description}>Recoge en el salón. Agregar al carrito no aparta existencias.</Text></View>
          {cantidad > 0 && <Text accessibilityLiveRegion="polite" style={styles.stock}>{cantidad} en tu carrito</Text>}
        </ScrollView>
        <View style={styles.footer}>
          {onVerCarrito && <AvisoCarrito agregado={agregado} onVerCarrito={onVerCarrito} />}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Agregar ${producto.nombre} desde vista previa`}
            accessibilityState={{ disabled }} disabled={disabled} onPress={() => onAgregar(producto)}
            style={[styles.add, disabled && styles.disabled]}>
            <Text style={styles.addText}>{limite === 0 ? 'No disponible' : cantidad >= limite ? 'Máximo en carrito' : 'Agregar al carrito'}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Seguir explorando</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  </Modal>;
}

const baseStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 },
  eyebrow: { color: '#886B12', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  close: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  image: { width: '100%', height: 230, borderRadius: 16, backgroundColor: '#F8FAFC' },
  category: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 8 },
  title: { color: '#1E3A5A', fontSize: 24, lineHeight: 30, fontWeight: '800' },
  price: { color: '#1E3A5A', fontSize: 22, fontWeight: '700' },
  description: { color: '#334155', fontSize: 14, lineHeight: 22, flexShrink: 1 },
  stock: { color: '#886B12', fontSize: 13, fontWeight: '600' },
  label: { color: '#1E3A5A', fontSize: 15, fontWeight: '700', marginTop: 8 },
  pickup: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#F1F5F9', borderRadius: 12 },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderColor: '#E2E8F0' },
  add: { backgroundColor: '#1E3A5A', borderRadius: 12, padding: 14, minHeight: 48, justifyContent: 'center' },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  secondary: { borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, minHeight: 44 },
  secondaryText: { color: '#886B12', textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
