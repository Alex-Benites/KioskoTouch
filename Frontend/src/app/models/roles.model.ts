export interface Permiso {
  id: number;
  name: string;
  codename: string;
  accion: 'crear' | 'modificar' | 'eliminar' | 'ver' | 'otros';
  content_type__app_label: string;
  content_type__model: string;
}

export interface Gestion {
  label: string;
  permisos: Permiso[];
  models: string[];
}

export interface GestionesData {
  usuarios: Gestion;
  productos: Gestion;
  menus: Gestion;
  promociones: Gestion;
  pantallas_cocina: Gestion;
  establecimientos: Gestion;
  publicidad: Gestion;
  kiosko_touch: Gestion;
}

export interface ResumenGestion {
  label: string;
  total_permisos: number;
  acciones: {
    crear: number;
    modificar: number;
    eliminar: number;
    ver: number;
    otros?: number;
  };
}

export interface GestionesResponse {
  gestiones: GestionesData;
  resumen: { [key: string]: ResumenGestion };
  permisos_raw: Permiso[];
  apps_incluidas: string[];
  total_permisos: number;
}

export interface Grupo {
  id: number;
  name: string;
  permisos_count?: number;
}

export interface GruposResponse {
  grupos: Grupo[];
  total: number;
}

export interface CrearRolRequest {
  nombre: string;
  permisos: number[];
}

export interface EditarRolRequest {
  nombre?: string;
  permisos: number[];
}

export interface DetalleRol {
  grupo: {
    id: number;
    name: string;
    permisos: Permiso[];
    permisos_count: number;
  };
}

export interface RolResponse {
  message: string;
  grupo: {
    id: number;
    name: string;
    permisos_count: number;
  };
}

export interface GestionUI {
  key: string;
  label: string;
  permisos: {
    crear: Permiso[];
    modificar: Permiso[];
    eliminar: Permiso[];
    ver: Permiso[];
    otros: Permiso[];
  };
  seleccionados: {
    crear: boolean;
    modificar: boolean;
    eliminar: boolean;
    ver: boolean;
    todos: boolean;
  };
}

export type AccionPermiso = 'crear' | 'modificar' | 'eliminar' | 'ver' | 'todos';
export type TipoGestion = keyof GestionesData;

export interface EstadoCarga {
  cargando: boolean;
  error: string | null;
  datos: any | null;
}

export interface FiltrosPermisos {
  app?: string;
  accion?: AccionPermiso;
  busqueda?: string;
}