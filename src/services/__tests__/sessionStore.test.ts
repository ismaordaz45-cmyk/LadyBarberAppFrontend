import { sessionStore } from '../sessionStore';

describe('Pruebas Unitarias: SessionStore Singleton', () => {
  beforeEach(() => {
    sessionStore.clearSession();
  });

  it('debe iniciar sin autenticación y con valores nulos', () => {
    expect(sessionStore.isAuthenticated).toBe(false);
    expect(sessionStore.token).toBeNull();
    expect(sessionStore.userId).toBeNull();
    expect(sessionStore.userNombre).toBeNull();
    expect(sessionStore.userRol).toBeNull();
  });

  it('debe almacenar correctamente la sesión al invocar setSession', () => {
    sessionStore.setSession('jwt_token_valido_123', 10, 'Ismael Ordaz', 'CLIENTE');

    expect(sessionStore.isAuthenticated).toBe(true);
    expect(sessionStore.token).toBe('jwt_token_valido_123');
    expect(sessionStore.userId).toBe(10);
    expect(sessionStore.userNombre).toBe('Ismael Ordaz');
    expect(sessionStore.userRol).toBe('CLIENTE');
  });

  it('debe limpiar completamente los datos de sesión al invocar clearSession (logout)', () => {
    sessionStore.setSession('jwt_token_valido_123', 10, 'Ismael Ordaz', 'CLIENTE');
    expect(sessionStore.isAuthenticated).toBe(true);

    sessionStore.clearSession();

    expect(sessionStore.isAuthenticated).toBe(false);
    expect(sessionStore.token).toBeNull();
    expect(sessionStore.userId).toBeNull();
    expect(sessionStore.userNombre).toBeNull();
    expect(sessionStore.userRol).toBeNull();
  });
});
