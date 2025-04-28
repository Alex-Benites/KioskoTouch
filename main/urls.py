from django.urls import path
from main.views.home import home
from django.contrib import admin 
from django.views.generic import TemplateView
from django.urls import re_path



urlpatterns = [
    # entrada principal
    path('', home, name='home'),

    # URLs para admin Django
    path('admin/django', admin.site.urls),

    re_path(r'^cliente/.*$', TemplateView.as_view(template_name='index.html')),

    re_path(r'^chef/.*$', TemplateView.as_view(template_name='index.html')),

    re_path(r'^administrador/.*$', TemplateView.as_view(template_name='index.html')),


]