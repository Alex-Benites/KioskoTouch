from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse
import os

def serve_angular(request):
    try:
        index_path = os.path.join(settings.BASE_DIR, '../Frontend/dist/frontend/index.html')  
        return FileResponse(open(index_path, 'rb'))
    except FileNotFoundError:
        from django.http import HttpResponse
        return HttpResponse("Frontend no encontrado. Ejecuta 'ng build --configuration production' primero.", status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('api/catalogo/', include('catalogo.urls')),
    path('api/comun/', include('comun.urls')),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/ventas/', include('ventas.urls')),               
    path('api/marketing/', include('marketing.urls')),        
    path('api/establecimientos/', include('establecimientos.urls')), 

    re_path(r'^(?!api/|admin/|static/|media/).*$', serve_angular, name='angular'),
]

# Archivos estáticos
if settings.DEBUG:
    # Desarrollo local
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Producción (PythonAnywhere)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)