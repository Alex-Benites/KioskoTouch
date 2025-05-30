from django.contrib import admin
from .models import (
    AppkioskoEstados,
    AppkioskoTipopago,
    AppkioskoImagen
)

admin.site.register(AppkioskoEstados)
admin.site.register(AppkioskoTipopago)
admin.site.register(AppkioskoImagen)