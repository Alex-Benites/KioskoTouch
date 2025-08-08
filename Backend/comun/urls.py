from django.urls import path
from .views import EstadosListView
from . import views

urlpatterns = [
    path('estados/', EstadosListView.as_view(), name='lista-estados'),
    path('imagenes/', views.gestionar_imagenes, name='gestionar_imagenes'),

    # ===== 🔧 GESTIÓN DE IVA (Existentes) =====
    path('iva/actual/', views.iva_actual, name='iva-actual'),
    path('iva/crear/', views.crear_iva, name='crear-iva'),
    path('iva/actualizar/', views.actualizar_iva, name='actualizar-iva'),

    # ===== 🆕 GESTIÓN COMPLETA DE CONFIGURACIÓN EMPRESARIAL =====
    
    # Configuración para facturas (público)
    path('empresa/configuracion/', views.configuracion_empresa, name='configuracion-empresa'),
    
    # CRUD completo de configuración empresarial (autenticado)
    path('empresa/gestionar/', views.gestionar_configuracion_empresa, name='gestionar-configuracion-empresa'),
    
    # Listar todas las configuraciones (admin)
    path('empresa/configuraciones/', views.listar_configuraciones, name='listar-configuraciones'),
    
    # Activar configuración específica
    path('empresa/activar/<int:config_id>/', views.activar_configuracion, name='activar-configuracion'),
    
    # Eliminar configuración específica
    path('empresa/eliminar/<int:config_id>/', views.eliminar_configuracion, name='eliminar-configuracion'),
]