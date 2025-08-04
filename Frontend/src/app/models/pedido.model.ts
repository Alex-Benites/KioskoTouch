export interface Pedido {
  id?: number;
  invoice_number: string;
  tipo_entrega: 'servir' | 'llevar' | null;
  total: number;
  numero_mesa?: number | null;
  cliente_id?: number;
  valor_descuento: number;
  cupon_id?: number;
  tipo_pago_id?: number;
  fecha_pago?: string;
  is_facturado: boolean;
  estado_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DetallePedidoProducto {
  producto_id: number;
  cantidad: number;
  subtotal: number;
  personalizacion?: PersonalizacionIngrediente[];
  precio_base?: number; // ✅ AGREGAR precio base sin personalizaciones
  tamano_codigo?: string; // ✅ AGREGAR código de tamaño para diferenciarlo
}

export interface DetallePedidoMenu {
  menu_id: number;
  cantidad: number;
  subtotal: number;
  productos: DetallePedidoProducto[];
}

export interface DetallePedido {
  id?: number;
  productos?: DetallePedidoProducto[];
  menus?: DetallePedidoMenu[];
  menu_id?: number;
  created_at?: string;
  updated_at?: string;
}



export interface PersonalizacionIngrediente {
  id?: number;
  pedido_id?: number;
  producto_id?: number;
  ingrediente_id: number;
  accion: 'agregar' | 'quitar';
  precio_aplicado: number;
  created_at?: string;
}


export interface SesionPedido {
  id?: number;
  kiosko_touch_id: number;
  pedido_id?: number;
  promocion_id?: number;
  fecha_inicio_pedido: string;
  fecha_fin_pedido?: string;
  created_at?: string;
  updated_at?: string;
}


export interface Factura {
  id?: number;
  nombre_cliente: string;
  email_cliente?: string;
  cedula_cliente?: string;
  telefono_cliente?: string;
  pedido_id?: number;
  cliente_id?: number;
  created_at?: string;
  updated_at?: string;
}

export type TipoEntrega = 'servir' | 'llevar';
export type AccionIngrediente = 'agregar' | 'quitar';


export interface CrearPedidoRequest {
  tipo_entrega: TipoEntrega;
  numero_mesa?: number;
  total: number;
  tipo_pago_id: number;
  detalles: Omit<DetallePedido, 'id' | 'pedido_id' | 'created_at' | 'updated_at'>[];
  personalizaciones?: Omit<PersonalizacionIngrediente, 'id' | 'pedido_id' | 'created_at'>[];
}

export interface PedidoResponse extends Pedido {
  detalles?: DetallePedido[];
  personalizaciones?: PersonalizacionIngrediente[];
  estado?: {
    id: number;
    nombre: string;
  };
  tipo_pago?: {
    id: number;
    nombre: string;
  };
}
