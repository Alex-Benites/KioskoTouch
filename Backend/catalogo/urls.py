from django.urls import path
from .views import ProductoListCreateAPIView, CategoriaListView

urlpatterns = [
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
    path('categorias/', CategoriaListView.as_view(), name='lista-categorias'),
    
]