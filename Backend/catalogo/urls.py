from django.urls import path
from .views import (
    ProductoListCreateAPIView, 
    CategoriaListView,
    get_ingredientes_por_categoria, 
    get_producto_imagen,
    get_producto_con_ingredientes,
    listar_productos_con_ingredientes,  
    get_estados,
    
)
from . import views  

urlpatterns = [
    # === PRODUCTOS ===
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
    
    # 🔧 CAMBIAR: Usar solo UNA ruta para detalle de producto
    path('productos/<int:pk>/', views.ProductoDetailAPIView.as_view(), name='producto-detail'),
    
    # 🔄 RENOMBRAR las otras para evitar conflictos
    path('productos/<int:producto_id>/detalle-funcion/', get_producto_con_ingredientes, name='producto-detalle-funcion'),
    path('productos/<int:producto_id>/imagen/', get_producto_imagen, name='producto-imagen'),
    path('productos/listado-completo/', listar_productos_con_ingredientes, name='productos-con-ingredientes'),
    
    # === CATEGORÍAS ===
    path('categorias/', CategoriaListView.as_view(), name='lista-categorias'),
    
    # === INGREDIENTES ===
    path('ingredientes/<str:categoria>/', get_ingredientes_por_categoria, name='ingredientes-categoria'),
    
    # === ESTADOS ===
    path('estados/', get_estados, name='estados-list'),
    
    
]