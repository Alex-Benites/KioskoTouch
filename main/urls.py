from django.urls import path
from main.views import chef_views, cliente_views, administrador_views
from main.views.home import home
from django.contrib import admin 

urlpatterns = [
    # entrada principal
    path('', home, name='home'),

    # URLs para el chef
    path('chef/', chef_views.chef_dashboard, name='chef_dashboard'),

    # URLs para el cliente
    path('cliente/menu/', cliente_views.cliente_menu, name='cliente_menu'),

    # URLs para el administrador
    path('admin/home/', administrador_views.admin_dashboard, name='admin_dashboard'),

    # URLs para admin Django
    path('admin/django', admin.site.urls),
]