from django.urls import path
from . import views
from .views import (
    PromocionListCreateAPIView,
    PromocionDetailAPIView,
    get_promocion_imagen,
    get_tamanos_promociones,
)

urlpatterns = [

    # Publicidades
    path('publicidades/', views.PublicidadListCreateView.as_view(), name='publicidad-list-create'),
    path('publicidades/<int:pk>/', views.PublicidadDetailView.as_view(), name='publicidad-detail'),
    path('publicidades/<int:pk>/toggle-estado/', views.PublicidadToggleEstadoView.as_view(), name='publicidad-toggle-estado'),
    path('publicidades/stats/', views.PublicidadStatsView.as_view(), name='publicidad-stats'),
    
    # Estados (para los dropdowns)
    path('estados/', views.EstadoListView.as_view(), name='estado-list'),

    # Promociones
    path('promociones/', PromocionListCreateAPIView.as_view(), name='promocion-list-create'),
    path('promociones/<int:pk>/', PromocionDetailAPIView.as_view(), name='promocion-detail'),
    path('promociones/<int:promocion_id>/imagen/', get_promocion_imagen, name='promocion-imagen'),

    # Tamaños de promociones
    path('tamanos/', get_tamanos_promociones, name='tamanos-promociones-list'),
]
