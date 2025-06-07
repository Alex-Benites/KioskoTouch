export interface KioskoTouch {
  id: number;
  nombre: string;
  token: string;
  estado: string;
  establecimiento?: {
    id: number;
    nombre: string;
    ciudad?: string;
    provincia?: string;
  } | null;
}