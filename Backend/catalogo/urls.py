from django.urls import path
from .views import ProductoListCreateAPIView, CategoriaListView, get_producto_imagen

urlpatterns = [
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
    path('categorias/', CategoriaListView.as_view(), name='lista-categorias'),
    path('productos/<int:producto_id>/imagen/', get_producto_imagen, name='producto-imagen'),
]