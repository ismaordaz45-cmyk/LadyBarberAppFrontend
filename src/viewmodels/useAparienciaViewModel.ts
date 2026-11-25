import { useContext } from 'react';
import { AparienciaContext } from '../contexts/aparienciaContext';

export function useAparienciaViewModel() { return useContext(AparienciaContext); }
