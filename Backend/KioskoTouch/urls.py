from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.urls import path, include
import os

def redirect_to_welcome(request):
    """Redirigir la raíz del sitio a /administrador/welcome"""
    return HttpResponseRedirect('/administrador/welcome')

def serve_angular_app(request):
    """Servir la aplicación Angular desde static files"""
    try:
        # NO servir Angular para rutas que empiecen con static/, media/, o admin/
        if request.path.startswith('/static/') or request.path.startswith('/media/') or request.path.startswith('/admin/'):
            raise Http404("Not found")

        # Buscar index.html en staticfiles
        index_path = os.path.join(settings.STATIC_ROOT, 'index.html')

        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HttpResponse(content, content_type='text/html')
        else:
            return HttpResponse(f"index.html no encontrado en: {index_path}", status=404)

    except Exception as e:
        return HttpResponse(f"Error al cargar frontend: {str(e)}", status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('', redirect_to_welcome, name='root_redirect'),  
    path('api/usuarios/', include('usuarios.urls')),
    path('api/catalogo/', include('catalogo.urls')),
    path('api/comun/', include('comun.urls')),
    path('api/ventas/', include('ventas.urls')), 
    path('api/marketing/', include('marketing.urls')),
    path('api/establecimientos/', include('establecimientos.urls')),
    path('api/categoria/', include('categoria.urls')),
    path('api/ventas/', include('ventas.urls')),
   
]

# AGREGAR MEDIA/STATIC ANTES del catch-all
if settings.DEBUG:
    # Desarrollo local
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Producción (PythonAnywhere)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# CATCH-ALL AL FINAL (después de media/static)
urlpatterns += [
    re_path(r'^.*$', serve_angular_app, name='angular_app'),
]