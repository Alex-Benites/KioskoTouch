from django.contrib import admin
from .models import (
    AppkioskoPromociones,
    AppkioskoCupon,
    AppkioskoPublicidades,
    AppkioskoImagen,
    AppkioskoVideo,
    AppkioskoPromocioncategoria,
    AppkioskoPromocionmenu,
    AppkioskoPromocionproductos,
    AppkioskoPublicidadestablecimiento,
    AppkioskoPublicidadkioskotouch
)

admin.site.register(AppkioskoPromociones)
admin.site.register(AppkioskoCupon)
admin.site.register(AppkioskoPublicidades)
admin.site.register(AppkioskoImagen)
admin.site.register(AppkioskoVideo)
admin.site.register(AppkioskoPromocioncategoria)
admin.site.register(AppkioskoPromocionmenu)
admin.site.register(AppkioskoPromocionproductos)
admin.site.register(AppkioskoPublicidadestablecimiento)
admin.site.register(AppkioskoPublicidadkioskotouch)