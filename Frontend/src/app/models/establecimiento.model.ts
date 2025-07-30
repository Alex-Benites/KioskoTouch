export interface Establecimiento {
  id: number;
  nombre: string;
  tipo_establecimiento: string;
  provincia: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  correo: string;
  responsable_id: number;
  responsable_nombre?: string;
  estado_id: number;
  estado_nombre?: string;
  created_at?: string;
  updated_at?: string;
  
  imagen_id?: number | null;
  imagen_url?: string | null;
  
  mapa_url?: string | null;
}