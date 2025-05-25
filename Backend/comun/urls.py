from django.urls import path
from .views import EstadosListView

urlpatterns = [
    path('estados/', EstadosListView.as_view(), name='lista-estados'),
]

