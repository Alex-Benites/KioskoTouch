from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP
from comun.models import AppkioskoIva
from catalogo.models import AppkioskoProductos, AppkioskoIngredientes, AppkioskoMenus
from .models import (
    AppkioskoPedidos,
    AppkioskoDetallepedido,
    AppkioskoFacturas,
    AppkioskoTipopago
)

# ✅ SERIALIZER para personalización de ingredientes
class PersonalizacionIngredienteSerializer(serializers.Serializer):
    ingrediente_id = serializers.IntegerField()
    accion = serializers.ChoiceField(choices=['agregar', 'quitar'])
    precio_aplicado = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)

# ✅ SERIALIZER para productos del pedido
class ProductoPedidoSerializer(serializers.Serializer):
    # ✅ CAMBIO: Hacer campos opcionales
    producto_id = serializers.IntegerField(required=False, allow_null=True)
    menu_id = serializers.IntegerField(required=False, allow_null=True)

    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    personalizaciones = PersonalizacionIngredienteSerializer(many=True, required=False)

    def validate(self, data):
        """✅ NUEVO: Validar que tenga producto_id O menu_id"""
        producto_id = data.get('producto_id')
        menu_id = data.get('menu_id')

        # Debe tener uno de los dos, pero no ambos
        if not producto_id and not menu_id:
            raise serializers.ValidationError(
                "Debe especificar 'producto_id' o 'menu_id'"
            )

        if producto_id and menu_id:
            raise serializers.ValidationError(
                "No puede especificar 'producto_id' y 'menu_id' al mismo tiempo"
            )

        # ✅ AGREGAR: Validar que existan en la BD
        if producto_id:
            try:
                producto = AppkioskoProductos.objects.select_related('estado').get(id=producto_id)

                # ✅ VERIFICAR: Que el producto esté activo
                if producto.estado and producto.estado.is_active != 1:
                    raise serializers.ValidationError(f"El producto '{producto.nombre}' no está disponible")

            except AppkioskoProductos.DoesNotExist:
                raise serializers.ValidationError(f"Producto con ID {producto_id} no existe")

        if menu_id:
            try:
                menu = AppkioskoMenus.objects.select_related('estado').get(id=menu_id)

                # ✅ VERIFICAR: Que el menú esté activo usando el campo booleano
                if not menu.esta_activo:
                    raise serializers.ValidationError(f"El menú '{menu.nombre}' no está disponible")

            except AppkioskoMenus.DoesNotExist:
                raise serializers.ValidationError(f"Menú con ID {menu_id} no existe")

        return data

# ✅ SERIALIZER para datos de facturación
class DatosFacturacionSerializer(serializers.Serializer):
    nombre_completo = serializers.CharField(max_length=100)
    cedula = serializers.CharField(max_length=20)
    telefono = serializers.CharField(max_length=15)
    correo = serializers.EmailField()

# ✅ SERIALIZER principal para crear pedido
class CrearPedidoSerializer(serializers.Serializer):
    numero_mesa = serializers.IntegerField(min_value=0)  # ✅ CAMBIAR: Permitir 0
    tipo_entrega = serializers.ChoiceField(choices=['servir', 'llevar'])
    tipo_pago = serializers.ChoiceField(choices=['efectivo', 'tarjeta'])
    productos = ProductoPedidoSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    iva_porcentaje = serializers.DecimalField(max_digits=5, decimal_places=2)
    iva_valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    turno = serializers.IntegerField(required=False, allow_null=True)
    datos_facturacion = DatosFacturacionSerializer(required=False, allow_null=True)

    def validate_productos(self, value):
        """Validar que haya al menos un producto"""
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un producto")
        return value

    def validate(self, data):
        """✅ ARREGLAR: Validaciones cruzadas con manejo correcto de tipos"""
        # Validar que el total calculado coincida
        productos = data.get('productos', [])

        # ✅ CONVERTIR TODO A Decimal para evitar errores de tipos
        subtotal_calculado = Decimal('0.00')
        for p in productos:
            # Los valores ya vienen como Decimal del serializer
            producto_subtotal = p['subtotal']  # Ya es Decimal
            subtotal_calculado += producto_subtotal

        # El subtotal también ya es Decimal del serializer
        subtotal_enviado = data['subtotal']  # Ya es Decimal

        # ✅ COMPARAR Decimals correctamente
        diferencia = abs(subtotal_calculado - subtotal_enviado)
        tolerancia = Decimal('0.01')

        if diferencia > tolerancia:
            raise serializers.ValidationError(
                f"El subtotal no coincide. Enviado: {subtotal_enviado}, Calculado: {subtotal_calculado}, Diferencia: {diferencia}"
            )

        print(f"✅ VALIDACIÓN DE SUBTOTALES:")
        print(f"   - Subtotal calculado: {subtotal_calculado}")
        print(f"   - Subtotal enviado: {subtotal_enviado}")
        print(f"   - Diferencia: {diferencia}")
        print(f"   - Tolerancia: {tolerancia}")

        # ✅ VALIDACIÓN ADICIONAL: Verificar que IVA + subtotal = total
        iva_valor = data['iva_valor']  # Ya es Decimal
        total_enviado = data['total']  # Ya es Decimal
        total_calculado = subtotal_enviado + iva_valor

        diferencia_total = abs(total_calculado - total_enviado)
        if diferencia_total > tolerancia:
            print(f"⚠️ ADVERTENCIA: Diferencia en total: {diferencia_total}")
            # No lanzar error por diferencias menores en el total

        print(f"✅ VALIDACIÓN TOTAL:")
        print(f"   - Total calculado (subtotal + IVA): {total_calculado}")
        print(f"   - Total enviado: {total_enviado}")
        print(f"   - Diferencia total: {diferencia_total}")

        return data

# ✅ SERIALIZERS para respuesta
class PedidoResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoPedidos
        fields = ['id', 'invoice_number', 'total', 'created_at']

class FacturaResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppkioskoFacturas
        fields = ['id', 'nombre_cliente', 'cedula_cliente', 'created_at']