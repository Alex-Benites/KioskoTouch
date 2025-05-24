from django.urls import path
from .views import ProductoListCreateAPIView 

urlpatterns = [
    path('productos/', ProductoListCreateAPIView.as_view(), name='producto-list-create'),
]