from django.urls import path
from .views import (
    ProductoListCreateAPIView,
    CategoriaListView,
    MenuListCreateAPIView,
    MenuDetailAPIView,
    get_producto_imagen,
    get_producto_con_ingredientes,
    listar_productos_con_ingredientes,
    get_estados,
    get_menu_imagen,
    get_tamanos,
    # Solo las nuevas vistas de ingredientes
    IngredienteListCreateAPIView,
    IngredienteDetailAPIView,
    IngredientesPorCategoriaView,  # Asegúrate de importar la vista aquí
)
from . import views

urlpatterns = [
    # === PRODUCTOS ===
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
    path('productos/<int:pk>/', views.ProductoDetailAPIView.as_view(), name='producto-detail'),
    path('productos/<int:producto_id>/detalle-funcion/', get_producto_con_ingredientes, name='producto-detalle-funcion'),
    path('productos/<int:producto_id>/imagen/', get_producto_imagen, name='producto-imagen'),
    path('productos/listado-completo/', listar_productos_con_ingredientes, name='productos-con-ingredientes'),

    # === CATEGORÍAS ===
    path('categorias/', CategoriaListView.as_view(), name='lista-categorias'),

    # === INGREDIENTES ===
    # 🆕 SOLO RUTAS MEJORADAS
    path('ingredientes/', IngredienteListCreateAPIView.as_view(), name='ingrediente-list-create'),
    path('ingredientes/<int:pk>/', IngredienteDetailAPIView.as_view(), name='ingrediente-detail'),
    path('ingredientes/categoria/<str:categoria>/', IngredientesPorCategoriaView.as_view(), name='ingredientes-por-categoria'),  # Ruta añadida

    # === ESTADOS ===
    path('estados/', get_estados, name='estados-list'),

    # === TAMAÑOS ===
    path('tamanos/', get_tamanos, name='tamanos-list'),

    # === MENUS ===
    path('menus/', MenuListCreateAPIView.as_view(), name='menu-list-create'),
    path('menus/<int:pk>/', MenuDetailAPIView.as_view(), name='menu-detail'),
    path('menus/<int:menu_id>/imagen/', get_menu_imagen, name='menu-imagen'),

    # ✅ NUEVA URL para ingredientes por producto
    path('productos/<int:producto_id>/ingredientes/', views.obtener_ingredientes_por_producto, name='ingredientes-por-producto'),

    # ✅ AGREGAR: URL para menús activos
    path('menus/activos/', views.get_menus_activos, name='menus-activos'),
]