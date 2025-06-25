// ✅ ESTRUCTURA para enviar al backend
export interface PedidoRequest {
  // Datos básicos del pedido
  numero_mesa: number;
  tipo_entrega: 'servir' | 'llevar';
  tipo_pago: 'efectivo' | 'tarjeta';

  // Productos con personalizaciones
  productos: ProductoPedidoRequest[];

  // Datos de facturación (opcional)
  datos_facturacion?: DatosFacturacion;

  // Datos adicionales
  turno?: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_valor: number;
  total: number;
}

export interface ProductoPedidoRequest {
  // ✅ CAMBIO: Hacer campos opcionales
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

// ✅ RESPUESTA del backend
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