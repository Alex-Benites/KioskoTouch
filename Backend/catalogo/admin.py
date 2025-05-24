from django.contrib import admin
from .models import AppkioskoCategorias, AppkioskoProductos, AppkioskoMenus, AppkioskoMenuproductos

admin.site.register(AppkioskoCategorias)
admin.site.register(AppkioskoProductos)
admin.site.register(AppkioskoMenus)
admin.site.register(AppkioskoMenuproductos)
