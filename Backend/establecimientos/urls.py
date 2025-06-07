from django.urls import path
from . import views

urlpatterns = [
    path('crear/', views.crear_establecimiento, name='crear_establecimiento'),
    path('', views.listar_establecimientos, name='listar_establecimientos'),
    path('<int:pk>/', views.establecimiento_detalle_o_eliminar, name='establecimiento_detalle_o_eliminar'),

    # Kioscos Touch - nueva sección
    path('kioscos-touch/crear/', views.crear_kiosko_touch, name='crear_kiosko_touch'),
    path('kioscos-touch/', views.listar_kioscos_touch, name='listar_kioscos_touch'),
    path('kioscos-touch/<int:pk>/', views.kiosco_touch_detalle_o_eliminar, name='kiosco_touch_detalle_o_eliminar'),

    # Pantallas Cocina
    path('pantallas-cocina/crear/', views.crear_pantalla_cocina, name='crear_pantalla_cocina'),
    path('pantallas-cocina/', views.listar_pantallas_cocina, name='listar_pantallas_cocina'),
    path('pantallas-cocina/<int:pk>/', views.pantalla_cocina_detalle_o_eliminar, name='pantalla_cocina_detalle_o_eliminar'),

  # 🆕 AGREGAR ENDPOINT PARA IMÁGENES
    path('imagenes/', views.gestionar_imagenes_establecimientos, name='gestionar_imagenes_establecimientos'),
]