from django.urls import path
from . import views

urlpatterns = [
    # ✅ ENDPOINTS para gestión de pedidos
    path('pedidos/crear/', views.crear_pedido, name='crear-pedido'),
    path('pedidos/<int:pedido_id>/', views.obtener_pedido, name='obtener-pedido'),
]
