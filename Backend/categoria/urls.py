# ✅ CREAR Backend/categoria/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.CategoriaListCreateAPIView.as_view(), name='categoria-list-create'),
    path('<int:pk>/', views.CategoriaDetailAPIView.as_view(), name='categoria-detail'),
]