import { useState } from 'react';

export const usePerfilViewModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [perfil, setPerfil] = useState(null);

  const handleCerrarSesion = () => {
    // Lógica para cerrar sesión
  };

  return {
    isLoading,
    perfil,
    handleCerrarSesion
  };
};
