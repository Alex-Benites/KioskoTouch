from django.urls import path
from . import views

urlpatterns = [

    # Publicidades
    path('publicidades/', views.PublicidadListCreateView.as_view(), name='publicidad-list-create'),
    path('publicidades/<int:pk>/', views.PublicidadDetailView.as_view(), name='publicidad-detail'),
    path('publicidades/<int:pk>/toggle-estado/', views.PublicidadToggleEstadoView.as_view(), name='publicidad-toggle-estado'),
    path('publicidades/stats/', views.PublicidadStatsView.as_view(), name='publicidad-stats'),
    
    # Estados (para los dropdowns)
    path('estados/', views.EstadoListView.as_view(), name='estado-list'),

]
