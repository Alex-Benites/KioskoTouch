import { Estado } from './catalogo.model';

export interface Imagen {
  id: number;
  ruta: string;
  categoria_imagen: string;
  entidad_relacionada_id: number;
}

export interface Video {
  id: number;
  nombre: string;
  ruta: string;
  duracion: number;
  duracion_formateada: string;
  publicidad: number;
}

export interface Publicidad {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_publicidad: TipoPublicidad;
  fecha_inicio_publicidad: string;
  fecha_fin_publicidad: string;
  estado: number;
  estado_nombre?: string;
  estado_info?: Estado;
  tiempo_visualizacion: number; 
  media_type?: 'image' | 'video' | null;
  media_url?: string;
  duracion_video?: number;
  videos?: Video[];
  imagenes?: Imagen[];
  promocion?: number;
  created_at: string;
  updated_at?: string;
}

export interface PublicidadStats {
  total: number;
  activas: number;
  inactivas: number;
  banners: number;
  videos: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  status: number;
}

// Tipos simples para el formulario (coinciden con el modelo Django)
export type TipoPublicidad = 'banner' | 'video';
export type UnidadTiempo = 'segundos' | 'minutos' | 'horas';