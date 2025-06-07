export interface PantallaCocina {
  id?: number;
  nombre: string;
  token: string;
  estado: string;
    kiosco_touch?: {  
    id: number;
    nombre: string;
  } | null;
}