from django.contrib import admin
from .models import (
    AppkioskoPromociones,
    AppkioskoPromocionproductos,  # ESTE modelo SÍ va en marketing
    AppkioskoPromocionmenu,
    AppkioskoPublicidades,
    AppkioskoPublicidadestablecimiento,
    AppkioskoPublicidadkioskotouch,
    AppkioskoVideo
)

admin.site.register(AppkioskoPromociones)
admin.site.register(AppkioskoPromocionproductos)
admin.site.register(AppkioskoPromocionmenu)
admin.site.register(AppkioskoPublicidades)
admin.site.register(AppkioskoPublicidadestablecimiento)
admin.site.register(AppkioskoPublicidadkioskotouch)
admin.site.register(AppkioskoVideo)