from django.urls import path
from .views import (
    ProductoListCreateAPIView, 
    CategoriaListView,
    get_ingredientes_por_categoria, 
    get_producto_imagen,
    get_producto_con_ingredientes,      # ← FALTA
    listar_productos_con_ingredientes,  # ← FALTA
    get_estados,                        # ← FALTA
    eliminar_producto                   # ← FALTA (si la tienes en views.py)
)

urlpatterns = [
    # === PRODUCTOS ===
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
    path('productos/<int:producto_id>/', get_producto_con_ingredientes, name='producto-detalle'),  # ← FALTA
    path('productos/<int:producto_id>/imagen/', get_producto_imagen, name='producto-imagen'),
    path('productos/con-ingredientes/', listar_productos_con_ingredientes, name='productos-con-ingredientes'),  # ← FALTA
    
    # === CATEGORÍAS ===
    path('categorias/', CategoriaListView.as_view(), name='lista-categorias'),
    
    # === INGREDIENTES ===
    path('ingredientes/<str:categoria>/', get_ingredientes_por_categoria, name='ingredientes-categoria'),
    
    # === ESTADOS ===
    path('estados/', get_estados, name='estados-list'),  # ← FALTA
    
    # === ELIMINAR (opcional) ===
    # path('productos/<int:producto_id>/eliminar/', eliminar_producto, name='producto-eliminar'),  # ← FALTA (si existe)
]