from django.contrib import admin
from .models import (
    AppkioskoEstablecimientos,
    AppkioskoEstablecimientosusuarios,
    AppkioskoPantallascocina,
    AppkioskoKioskostouch
)

admin.site.register(AppkioskoEstablecimientos)
admin.site.register(AppkioskoEstablecimientosusuarios)
admin.site.register(AppkioskoPantallascocina)
admin.site.register(AppkioskoKioskostouch)