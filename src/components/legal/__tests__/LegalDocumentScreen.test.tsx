import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../../content/legal';
import { PRIVACY_POLICY_URL, openLegalUrl } from '../../../services/legalLinks';
import { LegalDocumentScreen } from '../LegalDocumentScreen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('../../../services/legalLinks', () => ({
  PRIVACY_POLICY_URL: 'https://salon-lady-barber-frontend.vercel.app/privacidad',
  openLegalUrl: jest.fn(),
}));

const useRouterMock = useRouter as jest.Mock;
const openLegalUrlMock = openLegalUrl as jest.Mock;

describe('Cumplimiento legal LegalDocumentScreen', () => {
  let renderer: any;
  const back = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ back });
    openLegalUrlMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    renderer = null;
  });

  it('muestra política, versión, contacto, proveedores y eliminación', () => {
    act(() => {
      renderer = create(<LegalDocumentScreen title="Política de privacidad" subtitle="Privacidad" lastUpdated="8 de noviembre de 2026" sections={PRIVACY_SECTIONS} />);
    });
    const text = renderer.root.findAllByType(Text).map((node: any) => node.props.children).flat(Infinity).join(' ');
    expect(text).toContain('Política de privacidad');
    expect(text).toContain('8 de noviembre de 2026');
    expect(text).toContain('Render');
    expect(text).toContain('eliminar tu cuenta');
    expect(text).toContain('mayores de 18 años');
  });

  it('muestra el alcance real del catálogo y pagos físicos en los términos', () => {
    act(() => {
      renderer = create(<LegalDocumentScreen title="Términos y condiciones" subtitle="Términos" lastUpdated="8 de noviembre de 2026" sections={TERMS_SECTIONS} />);
    });
    const text = renderer.root.findAllByType(Text).map((node: any) => node.props.children).flat(Infinity).join(' ');
    expect(text).toContain('servicios físicos');
    expect(text).toContain('no permite comprar productos');
  });

  it('permite volver sin depender de servicios externos', () => {
    act(() => {
      renderer = create(<LegalDocumentScreen title="Documento" subtitle="Legal" lastUpdated="hoy" sections={[]} />);
    });
    act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('abre la versión pública únicamente al pulsar el enlace', async () => {
    await act(async () => {
      renderer = create(<LegalDocumentScreen title="Documento" subtitle="Legal" lastUpdated="hoy" sections={[]} externalLinks={[{ label: 'Ver política publicada', url: PRIVACY_POLICY_URL }]} />);
    });

    const link = renderer.root.findByProps({ accessibilityLabel: 'Ver política publicada' });
    await act(async () => link.props.onPress());
    expect(openLegalUrlMock).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  });
});
