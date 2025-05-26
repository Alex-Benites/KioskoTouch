export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: string;  
  categoria: number;
  estado: number;
  promocion?: number | null;
  imagen?: File | null;
  imagenProductoUrl: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Estado {
  id: number;
  nombre: string;
}