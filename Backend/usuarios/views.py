from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Permission, Group
from .models import AppkioskoEmpleados
from django.db import transaction

# Create your views here.

def get_user_permissions(user):
    """Obtiene todos los permisos del usuario en formato app.codename"""
    # Si es superuser, tiene todos los permisos
    if user.is_superuser:
        all_permissions = Permission.objects.select_related('content_type').all()
        formatted_permissions = []
        for perm in all_permissions:
            app_label = perm.content_type.app_label
            permission_code = f"{app_label}.{perm.codename}"
            formatted_permissions.append(permission_code)
        return formatted_permissions
    
    # Para usuarios normales, obtener permisos específicos
    # Permisos directos del usuario
    user_permissions = user.user_permissions.select_related('content_type').all()
    # Permisos de grupos
    group_permissions = Permission.objects.filter(
        group__user=user
    ).select_related('content_type').all()
    
    all_permissions = list(user_permissions) + list(group_permissions)
    
    # Formatear como app_label.codename
    formatted_permissions = []
    for perm in all_permissions:
        app_label = perm.content_type.app_label
        permission_code = f"{app_label}.{perm.codename}"
        formatted_permissions.append(permission_code)
    
    return list(set(formatted_permissions))

@api_view(['POST'])
@permission_classes([AllowAny])  # Permitir acceso sin autenticación
def login_empleado(request):
    """Login con email/username y contraseña"""
    email_or_username = request.data.get('email_or_username')
    password = request.data.get('password')
    
    if not email_or_username or not password:
        return Response({
            'error': 'Email/Username y contraseña son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Intentar autenticar primero como username
    user = authenticate(username=email_or_username, password=password)
    
    # Si no funciona como username, intentar como email
    if not user:
        try:
            user_by_email = User.objects.get(email=email_or_username)
            user = authenticate(username=user_by_email.username, password=password)
        except User.DoesNotExist:
            pass
    
    if user and user.is_active:
        # Para superuser, no es necesario que tenga registro en AppkioskoEmpleados
        empleado = None
        if not user.is_superuser:
            try:
                empleado = AppkioskoEmpleados.objects.get(user=user)
            except AppkioskoEmpleados.DoesNotExist:
                return Response({
                    'error': 'El usuario no es un empleado válido'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            # Para superuser, intentar obtener info de empleado si existe
            try:
                empleado = AppkioskoEmpleados.objects.get(user=user)
            except AppkioskoEmpleados.DoesNotExist:
                pass
        
        # Obtener permisos del usuario
        user_permissions = get_user_permissions(user)
        
        # Crear tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Agregar información adicional al token
        access_token['permissions'] = user_permissions
        access_token['user_id'] = user.id
        access_token['is_superuser'] = user.is_superuser
        if empleado:
            access_token['empleado_id'] = empleado.id
            access_token['cedula'] = empleado.cedula
        
        response_data = {
            'access_token': str(access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'groups': [group.name for group in user.groups.all()],
                'permissions': user_permissions,
                'empleado': None
            }
        }
        
        # Agregar info de empleado si existe
        if empleado:
            response_data['user']['empleado'] = {
                'id': empleado.id,
                'cedula': empleado.cedula,
                'nombres': empleado.nombres,
                'apellidos': empleado.apellidos,
                'telefono': empleado.telefono,
                'sexo': empleado.sexo
            }
        
        return Response(response_data)
    else:
        return Response({
            'error': 'Credenciales inválidas'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    """Verifica si el token es válido y devuelve información del usuario"""
    try:
        empleado = None
        if not request.user.is_superuser:
            empleado = AppkioskoEmpleados.objects.get(user=request.user)
        else:
            try:
                empleado = AppkioskoEmpleados.objects.get(user=request.user)
            except AppkioskoEmpleados.DoesNotExist:
                pass
        
        permissions = get_user_permissions(request.user)
        
        response_data = {
            'valid': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
                'groups': [group.name for group in request.user.groups.all()],
                'permissions': permissions,
                'empleado': None
            }
        }
        
        if empleado:
            response_data['user']['empleado'] = {
                'id': empleado.id,
                'cedula': empleado.cedula,
                'nombres': empleado.nombres,
                'apellidos': empleado.apellidos,
                'telefono': empleado.telefono,
                'sexo': empleado.sexo
            }
        
        return Response(response_data)
        
    except AppkioskoEmpleados.DoesNotExist:
        return Response({
            'error': 'Información de empleado no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions_endpoint(request):
    """Endpoint para obtener permisos del usuario autenticado"""
    permissions = get_user_permissions(request.user)
    groups = [group.name for group in request.user.groups.all()]
    
    return Response({
        'permissions': permissions,
        'groups': groups,
        'is_staff': request.user.is_staff,
        'is_superuser': request.user.is_superuser
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_empleado(request):
    """Logout del empleado"""
    try:
        # Sin blacklist, confirmamos el logout
        # En el frontend se eliminará el token del localStorage
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error en logout: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grupos_disponibles(request):
    """Obtener lista de grupos (roles) disponibles"""
    grupos = Group.objects.all().values('id', 'name')
    return Response({
        'grupos':list(grupos), 
        'total': len(grupos)}, 
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permisos_disponibles(request):
    """Obtener SOLO los permisos de modelos específicos (sin main)"""
    
    # 🎯 Mapeo EXACTO: gestión -> modelo específico (SIN app main)
    modelos_por_gestion = {
        'usuarios': {
            'label': 'Gestión de Usuarios',
            'modelo': 'user',
            'app_preferida': 'auth'  # NO main
        },
        'productos': {
            'label': 'Gestión de Productos', 
            'modelo': 'appkioskoproductos',
            'app_preferida': 'catalogo'  # NO main
        },
        'menus': {
            'label': 'Gestión de Menús',
            'modelo': 'appkioskomenus', 
            'app_preferida': 'catalogo'  # NO main
        },
        'promociones': {
            'label': 'Gestión de Promociones',
            'modelo': 'appkioskopromociones',
            'app_preferida': 'marketing'  # NO main
        },
        'pantallas_cocina': {
            'label': 'Gestión de Pantallas de Cocina',
            'modelo': 'appkioskopantallascocina',
            'app_preferida': 'establecimientos'  # NO main
        },
        'establecimientos': {
            'label': 'Gestión de Establecimientos',
            'modelo': 'appkioskoestablecimientos',
            'app_preferida': 'establecimientos'  # NO main
        },
        'publicidad': {
            'label': 'Gestión de Publicidad',
            'modelo': 'appkioskopublicidades',
            'app_preferida': 'marketing'  # NO main
        },
        'kiosko_touch': {
            'label': 'Gestión de Kiosko Touch',
            'modelo': 'appkioskokioskostouch',
            'app_preferida': 'establecimientos'  # NO main
        }
    }
    
    gestiones = {}
    
    for gestion_key, config in modelos_por_gestion.items():
        # 🎯 Buscar permisos de este modelo específico EN la app correcta (NO main)
        permisos_modelo = Permission.objects.filter(
            content_type__model=config['modelo'],
            content_type__app_label=config['app_preferida']  # 🚫 Excluir main implícitamente
        ).select_related('content_type').values(
            'id', 'name', 'codename', 'content_type__model', 'content_type__app_label'
        ).order_by('codename')
        
        gestiones[gestion_key] = {
            'label': config['label'],
            'permisos': []
        }
        
        # Solo permisos CRUD
        for permiso in permisos_modelo:
            accion = None
            if permiso['codename'].startswith('add_'):
                accion = 'crear'
            elif permiso['codename'].startswith('change_'):
                accion = 'modificar'  
            elif permiso['codename'].startswith('delete_'):
                accion = 'eliminar'
            elif permiso['codename'].startswith('view_'):
                accion = 'ver'
            
            if accion:
                permiso['accion'] = accion
                gestiones[gestion_key]['permisos'].append(permiso)
        
        # Debug por gestión
        print(f"✅ {gestion_key}: {len(gestiones[gestion_key]['permisos'])} permisos de {config['app_preferida']}.{config['modelo']}")

    total_permisos = sum(len(g['permisos']) for g in gestiones.values())
    
    print(f"\n🎯 TOTAL EXACTO: {total_permisos} permisos (debería ser 32)")
    
    return Response({
        'gestiones': gestiones,
        'total_permisos': total_permisos
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asignar_rol_empleado(request):
    """Asignar rol a un empleado específico"""
    try:
        empleado = AppkioskoEmpleados.objects.get(id=request.data['empleado_id'])
        nombre_grupo = request.data['rol']

        if not nombre_grupo:
            return Response({
                'error': 'El nombre del rol es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if empleado.agregar_rol(nombre_grupo):
            return Response({
                'message': f'Rol "{nombre_grupo}" asignado a {empleado.nombres} {empleado.apellidos}',
                'empleado_roles': empleado.nombres_roles
        }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': f'No se pudo asignar el rol "{nombre_grupo}" al empleado'
            }, status=status.HTTP_400_BAD_REQUEST)
    except AppkioskoEmpleados.DoesNotExist:
        return Response({
            'error': 'Empleado no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)