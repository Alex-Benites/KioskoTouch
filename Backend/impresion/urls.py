from django.urls import path
from . import views

urlpatterns = [
    path('factura/imprimir/', views.imprimir_factura, name='imprimir_factura'),
]