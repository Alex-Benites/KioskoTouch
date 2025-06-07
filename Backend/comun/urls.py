from django.urls import path
from .views import EstadosListView
from . import views

urlpatterns = [
    path('estados/', EstadosListView.as_view(), name='lista-estados'),
    path('imagenes/', views.gestionar_imagenes, name='gestionar_imagenes'),
    
]

