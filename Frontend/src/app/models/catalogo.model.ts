export interface Producto {
  id: number; // Quitar el ? para hacerlo obligatorio
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: number;
  estado: number;
  imagen?: File | null;
  imagenUrl?: string; // Agregar esta propiedad para la URL de la imagen
  created_at: string;
  updated_at: string;
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