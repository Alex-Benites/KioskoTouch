from django.contrib import admin
from .models import (
    AppkioskoEstados,
    AppkioskoTipopago,
    AppkioskoImagen,
    AppkioskoIva  # ✅ IMPORT correcto
)

# ✅ CORREGIR: Admin simple para el modelo simple
@admin.register(AppkioskoIva)
class AppkioskoIvaAdmin(admin.ModelAdmin):
    list_display = ('porcentaje_iva', 'activo')  # Solo campos que existen
    list_filter = ('activo',)  # Solo campo activo
    search_fields = ('porcentaje_iva',)  # Buscar por porcentaje

    fieldsets = (
        ('Configuración del IVA', {
            'fields': ('porcentaje_iva', 'activo')
        }),
    )

# Mantener los registros existentes
admin.site.register(AppkioskoEstados)
admin.site.register(AppkioskoTipopago)
admin.site.register(AppkioskoImagen)