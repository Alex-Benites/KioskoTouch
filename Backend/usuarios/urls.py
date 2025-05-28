from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_empleado, name='login_empleado'),
    path('auth/verify/', views.verify_token, name='verify_token'),
    path('auth/logout/', views.logout_empleado, name='logout_empleado'),
    path('auth/permissions/', views.get_user_permissions_endpoint, name='get_permissions'),
    
    # Password reset API endpoints
    path('auth/password-reset/', views.password_reset_request, name='password_reset_api'),
    path('auth/password-reset-confirm/<str:uidb64>/<str:token>/', views.password_reset_confirm, name='password_reset_confirm_api'),
]