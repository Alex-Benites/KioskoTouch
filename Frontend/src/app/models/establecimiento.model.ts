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
  responsable_nombre?: string; // Nombre del responsable
  estado_id: number;
  estado_nombre?: string; // ✅ Nombre del estado
  created_at?: string;
  updated_at?: string;
  
  // 🖼️ Propiedades para imagen
  imagen_id?: number | null;
  imagen_url?: string | null;
  
  // 🗺️ Propiedades para mapa
  mapa_url?: string | null;
}