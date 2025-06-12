export interface Tamano {
    id: number;
    nombre: string;
    codigo: string;
    orden: number;
    activo: boolean;
}

export interface ProductoTamano {
    id: number;
    tamano: number;
    nombre_tamano: string;
    codigo_tamano: string;
    precio: number;
    activo: boolean;
}