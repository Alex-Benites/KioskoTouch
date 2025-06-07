export interface KioscoTouch {
  id: number;
  nombre: string;
  token: string;
  estado: string;
  establecimiento?: {
    id: number;
    nombre: string;
  } | null;
}