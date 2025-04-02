'''
Asocie la ruta raíz (‘’) con la vista basada en función (function-based view), con el alias main_index.

'''

from django.urls import path
from main.views import chef_views, cliente_views, administrador_views

urlpatterns = [
    # URLs para el chef
    path('chef/', chef_views.chef_dashboard, name='chef_dashboard'),

    # URLs para el cliente
    path('cliente/menu/', cliente_views.cliente_menu, name='cliente_menu'),

    # URLs para el administrador
    path('admin/dashboard/', administrador_views.admin_dashboard, name='admin_dashboard'),
]