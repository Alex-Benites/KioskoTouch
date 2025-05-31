from django.urls import path
from . import views

urlpatterns = [

    # URLs para autenticación 

    path('auth/login/', views.login_empleado, name='login_empleado'),
    path('auth/verify/', views.verify_token, name='verify_token'),
    path('auth/logout/', views.logout_empleado, name='logout_empleado'),
    path('auth/permissions/', views.get_user_permissions_endpoint, name='get_permissions'),
    
    # Password reset API endpoints
    path('auth/password-reset/', views.password_reset_request, name='password_reset_api'),
    path('auth/password-reset-confirm/<str:uidb64>/<str:token>/', views.password_reset_confirm, name='password_reset_confirm_api'),

    # URLs para grupos y roles
    path('grupos/', views.get_grupos_disponibles, name='grupos_disponibles'),
    path('grupos/crear/', views.crear_rol, name='crear_rol'),
    path('permisos/', views.get_permisos_disponibles, name='permisos_disponibles'),
    path('empleados/<int:empleado_id>/asignar-rol/', views.asignar_rol_empleado, name='asignar_rol_empleado'),

    path('grupos/<int:grupo_id>/', views.get_detalle_grupo, name='detalle_grupo'),
    path('grupos/<int:grupo_id>/editar/', views.editar_grupo, name='editar_grupo'),
    path('grupos/<int:grupo_id>/eliminar/', views.eliminar_grupo, name='eliminar_grupo'),


    path('empleados/crear/', views.crear_usuario, name='crear_usuario'),
    path('empleados/lista/', views.get_empleados_lista, name='empleados_lista'),
    path('empleados/<int:empleado_id>/', views.empleado_detalle_actualizar, name='empleado_detalle_actualizar'),
    path('empleados/<int:empleado_id>/eliminar/', views.eliminar_empleado, name='eliminar_empleado'),
]


