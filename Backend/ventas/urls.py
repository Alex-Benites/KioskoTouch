from django.urls import path
from . import views

urlpatterns = [
    # Endpoints para gestión de pedidos
    path('pedidos/crear/', views.crear_pedido, name='crear-pedido'),
    path('pedidos/<int:pedido_id>/', views.obtener_pedido, name='obtener-pedido'),
    
    # Endpoints para chef
    path('pedidos/chef/', views.obtener_pedidos_chef, name='obtener-pedidos-chef'),
    path('pedidos/<int:pedido_id>/estado/', views.cambiar_estado_pedido, name='cambiar-estado-pedido'),
]