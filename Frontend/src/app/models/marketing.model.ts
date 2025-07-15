import {Menu,Producto } from './catalogo.model';

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
  descripcion?: string;
  tipo_publicidad: string;
  seccion: string;
  seccion_nombre?: string;
  fecha_inicio_publicidad: string;
  fecha_fin_publicidad: string;
  estado: number;
  estado_nombre?: string;
  tiempo_visualizacion: number;
  
  media_type: 'image' | 'video' | 'image_multiple' | null;
  media_url: string | null;       
  media_urls?: string[];        
  duracion_video?: number;        
  
  es_multiple?: boolean;
  total_imagenes?: number;
  
  created_at: string;
  updated_at?: string;
}

export interface Promocion {
  id: number;
  nombre: string;
  descripcion: string;
  valor_descuento: number;
  fecha_inicio_promo: string;
  fecha_fin_promo: string;
  tipo_promocion: string;
  codigo_promocional: string;
  limite_uso_usuario: number;
  limite_uso_total: number;
  estado: number;
  productos: Producto[];
  menus: Menu[];
  imagen?: File | null;
  imagenUrl?: string;
  created_at: string;
  updated_at: string;
  productosLista?: string[];
  menusLista?: string[];
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

export type TipoPublicidad = 'banner' | 'video';
export type SeccionSistema = 'menu' | 'carrito' | 'pago' | 'turno' | 'global';
export type UnidadTiempo = 'segundos' | 'minutos' | 'horas';

export const SECCIONES_SISTEMA = [
  { value: 'menu', label: 'Menú de Productos' },
  { value: 'carrito', label: 'Carrito de Compras' },
  { value: 'pago', label: 'Proceso de Pago' },
  { value: 'turno', label: 'Sala de Espera/Turno' },
  { value: 'global', label: 'Todas las Secciones' }
] as const;
