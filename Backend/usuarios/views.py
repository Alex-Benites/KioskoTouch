from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Permission, Group
from .models import AppkioskoEmpleados, AppkioskoClientes
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
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



#recuperación de contraseña
# ...existing code...


@api_view(['POST'])
@permission_classes([AllowAny])  # Permitir acceso sin autenticación
def password_reset_request(request):
    """
    API endpoint para solicitar reset de contraseña
    Solo verifica que el usuario exista en auth_user
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'El email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Solo verificar que el usuario existe en auth_user
        user = User.objects.get(email=email)
        
        # Generar token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # URL del frontend Angular
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200')
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
        
        # Enviar email
        send_mail(
            'Recuperación de Contraseña - KioskoTouch',
            f'''Hola {user.username},

Has solicitado restablecer tu contraseña en KioskoTouch.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
{reset_url}

O copia y pega este código en la aplicación:
{uid}/{token}

Si no solicitaste este cambio, puedes ignorar este email.

Este enlace expirará en 24 horas por seguridad.

Gracias,
Equipo de KioskoTouch''',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': 'Se ha enviado un email con las instrucciones de recuperación'
        }, status=status.HTTP_200_OK)
            
    except User.DoesNotExist:
        return Response({
            'error': 'No existe un usuario registrado con este email'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error al enviar email: {e}")  # Para debug
        return Response({
            'error': 'Error al enviar el email de recuperación'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])  # Permitir acceso sin autenticación
def password_reset_confirm(request, uidb64, token):
    """
    API endpoint para confirmar reset de contraseña
    """
    new_password = request.data.get('new_password')
    
    if not new_password:
        return Response({
            'error': 'La nueva contraseña es requerida'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({
            'error': 'La contraseña debe tener al menos 8 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            
            return Response({
                'success': True,
                'message': 'Contraseña actualizada exitosamente'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'El enlace de recuperación es inválido o ha expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'error': 'Enlace de recuperación inválido'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error al actualizar contraseña: {e}")  # Para debug
        return Response({
            'error': 'Error al actualizar la contraseña' 
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    
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
    print(gestiones[gestion_key]['permisos'])
    
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
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_rol(request):
    """Crear un nuevo rol (grupo) con permisos específicos"""
    print("\n" + "="*60)
    print("🎯 DATOS RECIBIDOS PARA CREAR ROL:")
    print("="*60)
    print(f"Nombre: {request.data.get('nombre')}")
    print(f"Descripción: {request.data.get('descripcion')}")
    print(f"Permisos recibidos: {request.data.get('permisos')}")
    print(f"Cantidad de permisos: {len(request.data.get('permisos', []))}")
    print("="*60 + "\n")
    
    try:
        nombre = request.data.get('nombre')
        descripcion = request.data.get('descripcion', '')
        permisos_ids = request.data.get('permisos', [])
        
        # Validaciones
        if not nombre:
            return Response({
                'error': 'El nombre del rol es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not permisos_ids:
            return Response({
                'error': 'Debe seleccionar al menos un permiso'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el grupo ya existe
        if Group.objects.filter(name=nombre).exists():
            return Response({
                'error': f'Ya existe un rol con el nombre "{nombre}"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que los permisos existen
        permisos = Permission.objects.filter(id__in=permisos_ids)
        if len(permisos) != len(permisos_ids):
            return Response({
                'error': 'Algunos permisos seleccionados no son válidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el grupo en una transacción
        with transaction.atomic():
            # Crear el grupo
            grupo = Group.objects.create(name=nombre)
            
            # Asignar permisos
            grupo.permissions.set(permisos)
            
            # Log de éxito
            print(f"✅ ROL CREADO: {nombre}")
            print(f"   Permisos asignados: {len(permisos)}")
            for permiso in permisos:
                print(f"   - {permiso.content_type.app_label}.{permiso.codename}")
        
        return Response({
            'message': f'Rol "{nombre}" creado exitosamente',
            'rol': {
                'id': grupo.id,
                'nombre': grupo.name,
                'descripcion': descripcion,
                'permisos_count': len(permisos),
                'permisos': [
                    {
                        'id': p.id,
                        'name': p.name,
                        'codename': p.codename,
                        'app_label': p.content_type.app_label
                    } for p in permisos
                ]
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ ERROR CREANDO ROL: {str(e)}")
        return Response({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)