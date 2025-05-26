from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_empleado, name='login_empleado'),
    path('auth/verify/', views.verify_token, name='verify_token'),
    path('auth/logout/', views.logout_empleado, name='logout_empleado'),
    path('auth/permissions/', views.get_user_permissions_endpoint, name='get_permissions'),
]