import { ProductoTamano } from './tamano.model';

export interface Producto {
  id: number; // Quitar el ? para hacerlo obligatorio
  nombre: string;
  descripcion: string;
  precio: number;
  precio_base?: number; // ✅ Precio base (mínimo)
  categoria: number;
  estado: number;
  imagen?: File | null;
  imagenUrl?: string; // Agregar esta propiedad para la URL de la imagen
  created_at: string;
  updated_at: string;

  aplica_tamanos?: boolean;
  tamanos_detalle?: ProductoTamano[];
  precios_tamanos?: { [key: string]: number }; // Para enviar al crear/actualizar
}

export interface Categoria {
  id: number;
  nombre: string;
  imagen_url?: string; // Agregar esta propiedad
  created_at: string;
  updated_at: string;
}

export interface Estado {
  id: number;
  nombre: string;
}

export interface Menu {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipo_menu: string;
  estado: number;
  productos: Producto[];
  imagen?: File | null;
  imagenUrl?: string;
  created_at: string;
  updated_at: string;
  productosLista?: string[];
  menuLista?: string[];
}

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_producto: string;
  precio_adicional: string;
  // ✅ CAMPOS DE STOCK AGREGADOS
  stock: number;
  stock_minimo: number;
  unidad_medida: string;
  esta_agotado: boolean;
  necesita_reposicion: boolean;
  estado_stock: string;
  estado: number;
  imagen_url?: string;
  created_at: string;
  // ✅ CAMPOS ADICIONALES PARA COMPATIBILIDAD
  es_base?: boolean;
  permite_extra?: boolean;
}

export interface CrearIngredienteRequest {
  nombre: string;
  descripcion: string;
  categoria_producto: string;
  precio_adicional: number;
  estado: number;
  imagen?: File;
}
