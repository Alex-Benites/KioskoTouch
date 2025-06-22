from django.urls import path
from .views import EstadosListView
from . import views

urlpatterns = [
    path('estados/', EstadosListView.as_view(), name='lista-estados'),
    path('imagenes/', views.gestionar_imagenes, name='gestionar_imagenes'),

    # ✅ AGREGAR: URLs para gestión de IVA
    path('iva/actual/', views.iva_actual, name='iva-actual'),
    path('iva/crear/', views.crear_iva, name='crear-iva'),
    path('iva/actualizar/', views.actualizar_iva, name='actualizar-iva'),
]

