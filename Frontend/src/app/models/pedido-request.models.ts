export interface PedidoRequest {
  numero_mesa: number;
  tipo_entrega: 'servir' | 'llevar';
  tipo_pago: 'efectivo' | 'tarjeta';

  productos: ProductoPedidoRequest[];

  datos_facturacion?: DatosFacturacion;

  turno?: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_valor: number;
  total: number;
}

export interface ProductoPedidoRequest {
  producto_id?: number;
  menu_id?: number;

  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  personalizaciones: PersonalizacionRequest[];
}

export interface PersonalizacionRequest {
  ingrediente_id: number;
  accion: 'agregar' | 'quitar';
  precio_aplicado: number;
}

export interface DatosFacturacion {
  nombre_completo: string;
  cedula: string;
  telefono: string;
  correo: string;
}

export interface PedidoResponse {
  success: boolean;
  data?: {
    pedido_id: number;
    numero_pedido: string;
    factura_id?: number;
    numero_factura?: string;
  };
  message: string;
  error?: string;
}