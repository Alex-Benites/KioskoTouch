// Importar Estado del modelo de catálogo
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
  tipo_publicidad: string;
  fecha_inicio_publicidad: string;
  fecha_fin_publicidad: string;
  estado: number;
  estado_nombre?: string;
  estado_info?: Estado;
  media_type?: 'image' | 'video' | null;
  media_url?: string;
  duracion_video?: number;
  videos?: Video[];
  imagenes?: Imagen[];
  created_at: string;
  updated_at?: string;
}

export interface PublicidadCreateRequest {
  nombre: string;
  descripcion?: string;
  tipo_publicidad: string;
  fecha_inicio_publicidad: string;
  fecha_fin_publicidad: string;
  estado: string;
  media_file?: File;
  media_type?: string;
  videoDuration?: number;
  tiempo_intervalo_valor?: number;
  tiempo_intervalo_unidad?: string;
}

export interface PublicidadUpdateRequest {
  nombre?: string;
  descripcion?: string;
  tipo_publicidad?: string;
  fecha_inicio_publicidad?: string;
  fecha_fin_publicidad?: string;
  estado?: number;
  estado_str?: string;
  media_file?: File;
  media_type?: string;
  videoDuration?: number;
  tiempo_intervalo_valor?: number;
  tiempo_intervalo_unidad?: string;
  remove_media?: boolean;
}

export interface PublicidadStats {
  total: number;
  activas: number;
  inactivas: number;
  con_video: number;
  con_imagen: number;
  por_tipo: { [key: string]: number };
}

export interface PublicidadFilters {
  estado?: number;
  tipo_publicidad?: string;
  activo?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type TipoPublicidad = 'banner' | 'video' | 'popup';
export type EstadoPublicidad = 'activo' | 'inactivo';
export type UnidadTiempo = 'segundos' | 'minutos' | 'horas';

export interface PublicidadFormData {
  nombre: string;
  descripcion: string;
  tipoPublicidad: TipoPublicidad;
  fechaInicial: Date | null;
  fechaFinal: Date | null;
  estado: EstadoPublicidad;
  tiempoIntervaloValor: number;
  tiempoIntervaloUnidad: UnidadTiempo;
  mediaType: 'image' | 'video' | null;
  videoDuration: number | null;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: { [key: string]: string[] };
  success: boolean;
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