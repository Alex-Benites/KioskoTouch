// 🔑 Interfaz para un permiso individual
export interface Permiso {
  id: number;
  name: string;
  codename: string;
  accion: 'crear' | 'modificar' | 'eliminar' | 'ver' | 'otros';
  content_type__app_label: string;
  content_type__model: string;
}

// 📋 Interfaz para una gestión (agrupación de permisos)
export interface Gestion {
  label: string;
  permisos: Permiso[];
  models: string[];
}

// 🏢 Interfaz para las gestiones organizadas del backend
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

// 📊 Interfaz para el resumen de permisos por gestión
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

// 📈 Interfaz para la respuesta completa del backend
export interface GestionesResponse {
  gestiones: GestionesData;
  resumen: { [key: string]: ResumenGestion };
  permisos_raw: Permiso[];
  apps_incluidas: string[];
  total_permisos: number;
}

// 👤 Interfaz para un grupo/rol
export interface Grupo {
  id: number;
  name: string;
  permisos_count?: number;
}

// 📝 Interfaz para la respuesta de grupos
export interface GruposResponse {
  grupos: Grupo[];
  total: number;
}

// ➕ Interfaz para crear un nuevo rol
export interface CrearRolRequest {
  nombre: string;
  permisos: number[];
}

// ✏️ Interfaz para editar un rol existente
export interface EditarRolRequest {
  nombre?: string;
  permisos: number[];
}

// 🔍 Interfaz para el detalle de un rol específico
export interface DetalleRol {
  grupo: {
    id: number;
    name: string;
    permisos: Permiso[];
    permisos_count: number;
  };
}

// 📋 Interfaz para la respuesta de creación/edición de rol
export interface RolResponse {
  message: string;
  grupo: {
    id: number;
    name: string;
    permisos_count: number;
  };
}

// 🎨 Interfaz para el UI del componente (gestión con estados de selección)
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

// 📊 Tipos auxiliares
export type AccionPermiso = 'crear' | 'modificar' | 'eliminar' | 'ver' | 'todos';
export type TipoGestion = keyof GestionesData;

// 🔧 Interfaces para estados de carga
export interface EstadoCarga {
  cargando: boolean;
  error: string | null;
  datos: any | null;
}

// 📋 Interfaz para filtros de permisos 
export interface FiltrosPermisos {
  app?: string;
  accion?: AccionPermiso;
  busqueda?: string;
}