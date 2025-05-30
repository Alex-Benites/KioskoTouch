from django.contrib import admin
from .models import (
    AppkioskoCategorias, 
    AppkioskoProductos, 
    AppkioskoMenus, 
    AppkioskoMenuproductos,
    AppkioskoIngredientes,
    AppkioskoProductosIngredientes
)

admin.site.register(AppkioskoCategorias)
admin.site.register(AppkioskoProductos)
admin.site.register(AppkioskoMenus)
admin.site.register(AppkioskoMenuproductos)
admin.site.register(AppkioskoIngredientes)
admin.site.register(AppkioskoProductosIngredientes)