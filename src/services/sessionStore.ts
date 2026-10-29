/**
 * SessionStore – Singleton para gestionar el token JWT en memoria.
 *
 * Patrón Singleton: garantiza que exista una única instancia
 * compartida de la sesión durante toda la vida de la app.
 *
 * En el futuro puede migrarse a AsyncStorage / SecureStore
 * sin modificar ninguna capa superior (ViewModel/View).
 */
class SessionStore {
  private static instance: SessionStore;

  private _token: string | null = null;
  private _userId: number | null = null;
  private _userNombre: string | null = null;
  private _userRol: string | null = null;

  private constructor() {}

  /** Obtiene la única instancia de SessionStore (Singleton). */
  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  /** Guarda los datos de sesión tras un login exitoso. */
  setSession(token: string, userId: number, nombre: string, rol: string): void {
    this._token = token;
    this._userId = userId;
    this._userNombre = nombre;
    this._userRol = rol;
  }

  /** Borra todos los datos de sesión (logout). */
  clearSession(): void {
    this._token = null;
    this._userId = null;
    this._userNombre = null;
    this._userRol = null;
  }


  get token(): string | null { return this._token; }
  get userId(): number | null { return this._userId; }
  get userNombre(): string | null { return this._userNombre; }
  get userRol(): string | null { return this._userRol; }
  get isAuthenticated(): boolean { return this._token !== null; }
}

export const sessionStore = SessionStore.getInstance();
