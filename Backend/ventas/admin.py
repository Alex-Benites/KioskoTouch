from django.contrib import admin
from .models import (
    AppkioskoCupon,
    AppkioskoPedidos,
    AppkioskoDetallepedido,  # Era AppkioskoPedidosproductos
    AppkioskoPedidosessions,
    AppkioskoFacturas,
    AppkioskoDetallefacturaproducto,
    AppkioskoPedidoProductoIngredientes
)

admin.site.register(AppkioskoCupon)
admin.site.register(AppkioskoPedidos)
admin.site.register(AppkioskoDetallepedido)
admin.site.register(AppkioskoPedidosessions)
admin.site.register(AppkioskoFacturas)
admin.site.register(AppkioskoDetallefacturaproducto)
admin.site.register(AppkioskoPedidoProductoIngredientes)