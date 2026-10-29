import { useState } from 'react';

export const useHistorialViewModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [historial, setHistorial] = useState([]);

  return {
    isLoading,
    historial,
  };
};
