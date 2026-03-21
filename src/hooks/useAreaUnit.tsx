import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AreaUnit = 'm²' | 'ft²';

const SQM_TO_SQFT = 10.7639;

interface AreaUnitContextType {
  areaUnit: AreaUnit;
  setAreaUnit: (unit: AreaUnit) => void;
  convertArea: (value: number, fromUnit?: string) => number;
  formatArea: (value: number, fromUnit?: string) => string;
}

const AreaUnitContext = createContext<AreaUnitContextType>({
  areaUnit: 'm²',
  setAreaUnit: () => {},
  convertArea: (v) => v,
  formatArea: (v) => `${v} m²`,
});

export function AreaUnitProvider({ children }: { children: ReactNode }) {
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>(() => {
    const saved = localStorage.getItem('selectedAreaUnit');
    return (saved === 'ft²' ? 'ft²' : 'm²');
  });

  const setAreaUnit = (unit: AreaUnit) => {
    setAreaUnitState(unit);
    localStorage.setItem('selectedAreaUnit', unit);
  };

  // Listen for changes from Header dropdown
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('selectedAreaUnit');
      if (saved === 'm²' || saved === 'ft²') setAreaUnitState(saved);
    };
    window.addEventListener('area-unit-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('area-unit-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const convertArea = (value: number, fromUnit?: string): number => {
    if (!value) return 0;
    const source = fromUnit || 'm²';
    if (source === areaUnit) return value;
    // source is m², target is ft²
    if (source === 'm²' && areaUnit === 'ft²') return Math.round(value * SQM_TO_SQFT);
    // source is ft², target is m²
    if (source === 'ft²' && areaUnit === 'm²') return Math.round(value / SQM_TO_SQFT);
    return value;
  };

  const formatArea = (value: number, fromUnit?: string): string => {
    const converted = convertArea(value, fromUnit);
    return `${converted.toLocaleString()} ${areaUnit}`;
  };

  return (
    <AreaUnitContext.Provider value={{ areaUnit, setAreaUnit, convertArea, formatArea }}>
      {children}
    </AreaUnitContext.Provider>
  );
}

export function useAreaUnit() {
  return useContext(AreaUnitContext);
}
