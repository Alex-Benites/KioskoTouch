'''
Asocie la ruta raíz (‘’) con la vista basada en función (function-based view), con el alias main_index.

'''

from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='main_index'),
]