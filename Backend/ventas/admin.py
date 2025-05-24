from django.contrib import admin
from .models import (
    AppkioskoTipopago,
    AppkioskoPedidos,
    AppkioskoFacturas,
    AppkioskoDetallefacturaproducto,
    AppkioskoPedidosessions,
    AppkioskoPedidosproductos
)

admin.site.register(AppkioskoTipopago)
admin.site.register(AppkioskoPedidos)
admin.site.register(AppkioskoFacturas)
admin.site.register(AppkioskoDetallefacturaproducto)
admin.site.register(AppkioskoPedidosessions)
admin.site.register(AppkioskoPedidosproductos)