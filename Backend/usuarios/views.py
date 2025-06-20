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
from .models import PasswordResetToken
from django.utils import timezone

from establecimientos.models import AppkioskoEstablecimientos, AppkioskoEstablecimientosusuarios
from comun.models import AppkioskoEstados
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

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'El email es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
        # Generar token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Invalida el token anterior si existe
        PasswordResetToken.objects.filter(user=user).update(used=True)

        # Guarda el nuevo token
        PasswordResetToken.objects.update_or_create(
            user=user,
            defaults={'token': token, 'created_at': timezone.now(), 'used': False}
        )

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200')
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

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
        return Response({'success': True, 'message': 'Se ha enviado un email con las instrucciones de recuperación'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'No existe un usuario registrado con este email'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error al enviar email: {e}")
        return Response({'error': 'Error al enviar el email de recuperación'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request, uidb64, token):
    new_password = request.data.get('new_password')
    if not new_password:
        return Response({'error': 'La nueva contraseña es requerida'}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'error': 'La contraseña debe tener al menos 8 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)

        # Verifica el token en la base de datos
        try:
            reset_token = PasswordResetToken.objects.get(user=user, token=token, used=False)
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'El enlace de recuperación es inválido o ha expirado'}, status=status.HTTP_400_BAD_REQUEST)

        # Opcional: verifica expiración (24h)
        if (timezone.now() - reset_token.created_at).total_seconds() > 86400:
            reset_token.used = True
            reset_token.save()
            return Response({'error': 'El enlace de recuperación ha expirado'}, status=status.HTTP_400_BAD_REQUEST)

        # Cambia la contraseña y marca el token como usado
        user.set_password(new_password)
        user.save()
        reset_token.used = True
        reset_token.save()

        return Response({'success': True, 'message': 'Contraseña actualizada exitosamente'}, status=status.HTTP_200_OK)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Enlace de recuperación inválido'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error al actualizar contraseña: {e}")
        return Response({'error': 'Error al actualizar la contraseña'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
    """Obtener SOLO los permisos de modelos específicos"""

    # 🎯 Mapeo SIMPLE: gestión -> modelo específico
    modelos_por_gestion = {
        'usuarios': {
            'label': 'Gestión de Usuarios',
            'modelo': 'user',
            'app_label': 'auth'
        },
        'grupos': {
            'label': 'Gestión de Roles',
            'modelo': 'group',
            'app_label': 'auth'
        },
        'productos': {
            'label': 'Gestión de Productos',
            'modelo': 'appkioskoproductos',
            'app_label': 'catalogo'
        },
        'ingredientes': {
            'label': 'Gestión de Ingredientes',
            'modelo': 'appkioskoingredientes',
            'app_label': 'catalogo'
        },
        'categorias': {
            'label': 'Gestión de Categorías',
            'modelo': 'appkioskocategorias',
            'app_label': 'catalogo'
        },
        'menus': {
            'label': 'Gestión de Menús',
            'modelo': 'appkioskomenus',
            'app_label': 'catalogo'
        },
        'promociones': {
            'label': 'Gestión de Promociones',
            'modelo': 'appkioskopromociones',
            'app_label': 'marketing'
        },
        'pantallas_cocina': {
            'label': 'Gestión de Pantallas de Cocina',
            'modelo': 'appkioskopantallascocina',
            'app_label': 'establecimientos'
        },
        'establecimientos': {
            'label': 'Gestión de Establecimientos',
            'modelo': 'appkioskoestablecimientos',
            'app_label': 'establecimientos'
        },
        'publicidad': {
            'label': 'Gestión de Publicidad',
            'modelo': 'appkioskopublicidades',
            'app_label': 'marketing'
        },
        'kiosko_touch': {
            'label': 'Gestión de Kiosko Touch',
            'modelo': 'appkioskokioskostouch',
            'app_label': 'establecimientos'
        }
    }

    gestiones = {}

    for gestion_key, config in modelos_por_gestion.items():
        # 🎯 Buscar permisos de este modelo específico
        permisos_modelo = Permission.objects.filter(
            content_type__model=config['modelo'],
            content_type__app_label=config['app_label']
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
        print(f"✅ {gestion_key}: {len(gestiones[gestion_key]['permisos'])} permisos de {config['app_label']}.{config['modelo']}")

    total_permisos = sum(len(g['permisos']) for g in gestiones.values())

    print(f"\n🎯 TOTAL EXACTO: {total_permisos} permisos (debería ser 40 con grupos e ingredientes)")
    if gestiones:
        print(f"Última gestión procesada: {gestion_key}")

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_detalle_grupo(request, grupo_id):
    """Obtener detalles de un grupo específico con sus permisos"""
    try:
        grupo = Group.objects.get(id=grupo_id)
        permisos = grupo.permissions.select_related('content_type').all()

        return Response({
            'grupo': {
                'id': grupo.id,
                'name': grupo.name,
                'permisos': [
                    {
                        'id': p.id,
                        'name': p.name,
                        'codename': p.codename,
                        'accion': _get_accion_from_codename(p.codename),
                        'content_type__app_label': p.content_type.app_label,
                        'content_type__model': p.content_type.model
                    } for p in permisos
                ],
                'permisos_count': len(permisos)
            }
        }, status=status.HTTP_200_OK)

    except Group.DoesNotExist:
        return Response({
            'error': 'Grupo no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def editar_grupo(request, grupo_id):
    """Editar un grupo existente"""
    try:
        grupo = Group.objects.get(id=grupo_id)
        nombre = request.data.get('nombre')
        permisos_ids = request.data.get('permisos', [])

        # Validaciones
        if nombre and nombre != grupo.name:
            if Group.objects.filter(name=nombre).exists():
                return Response({
                    'error': f'Ya existe un rol con el nombre "{nombre}"'
                }, status=status.HTTP_400_BAD_REQUEST)
            grupo.name = nombre

        if not permisos_ids:
            return Response({
                'error': 'Debe seleccionar al menos un permiso'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que los permisos existen
        permisos = Permission.objects.filter(id__in=permisos_ids)
        if len(permisos) != len(permisos_ids):
            return Response({
                'error': 'Algunos permisos seleccionados no son válidos'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar en una transacción
        with transaction.atomic():
            grupo.save()
            grupo.permissions.set(permisos)

        return Response({
            'message': f'Rol "{grupo.name}" actualizado exitosamente',
            'grupo': {
                'id': grupo.id,
                'name': grupo.name,
                'permisos_count': len(permisos)
            }
        }, status=status.HTTP_200_OK)

    except Group.DoesNotExist:
        return Response({
            'error': 'Grupo no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_grupo(request, grupo_id):
    """Eliminar un grupo específico"""
    try:
        grupo = Group.objects.get(id=grupo_id)

        # Verificar si el grupo tiene usuarios asignados
        usuarios_count = grupo.user_set.count()
        if usuarios_count > 0:
            return Response({
                'error': f'No se puede eliminar: El rol "{grupo.name}" está asignado a {usuarios_count} usuario(s)'
            }, status=status.HTTP_400_BAD_REQUEST)

        nombre_grupo = grupo.name
        grupo.delete()

        return Response({
            'message': f'Rol "{nombre_grupo}" eliminado exitosamente'
        }, status=status.HTTP_200_OK)

    except Group.DoesNotExist:
        return Response({
            'error': 'Grupo no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

def _get_accion_from_codename(codename):
    """Helper para obtener la acción del codename"""
    if codename.startswith('add_'):
        return 'crear'
    elif codename.startswith('change_'):
        return 'modificar'
    elif codename.startswith('delete_'):
        return 'eliminar'
    elif codename.startswith('view_'):
        return 'ver'
    else:
        return 'otros'

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_usuario(request):
    """Crear un nuevo usuario empleado"""
    
    # 🔐 Verificar permisos
    if not request.user.has_perm('auth.add_user'):
        return Response({
            'error': 'No tienes permisos para crear usuarios'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # ✅ DEFINIR LA VARIABLE DATA AL INICIO
        data = request.data
        
        # 🔍 DEBUG: Mostrar datos recibidos
        print("============================================================")
        print("🎯 DATOS RECIBIDOS PARA CREAR USUARIO:")
        print("============================================================")
        print(f"Cédula: {data.get('cedula')}")
        print(f"Nombres: {data.get('nombres')}")
        print(f"Apellidos: {data.get('apellidos')}")
        print(f"Username: {data.get('username')}")
        print(f"Email: {data.get('email')}")
        print(f"Grupos: {data.get('grupos')}")
        print(f"Establecimiento: {data.get('establecimiento')}")
        print("============================================================")

        # Validaciones requeridas
        campos_requeridos = ['cedula', 'nombres', 'apellidos', 'username', 'email', 'password']
        for campo in campos_requeridos:
            if not data.get(campo):
                return Response({
                    'error': f'El campo {campo} es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Extraer datos
        cedula = data.get('cedula')
        nombres = data.get('nombres')
        apellidos = data.get('apellidos')
        fecha_nacimiento = data.get('fechaNacimiento')
        telefono = data.get('telefono', '')
        sexo = data.get('sexo', '')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        turno_trabajo = data.get('turnoTrabajo', '')
        grupos_ids = data.get('grupos', [])
        is_active = data.get('isActive', True)
        establecimiento_id = data.get('establecimiento')  # ✅ PUEDE SER NULL

        # Validar que el username y email no existan
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'El nombre de usuario ya existe'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)

        if AppkioskoEmpleados.objects.filter(cedula=cedula).exists():
            return Response({
                'error': 'La cédula ya está registrada'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Obtener grupos
        grupos = []
        if grupos_ids:
            grupos = Group.objects.filter(id__in=grupos_ids)
            if len(grupos) != len(grupos_ids):
                return Response({
                    'error': 'Uno o más grupos no existen'
                }, status=status.HTTP_400_BAD_REQUEST)

        # 🏗️ Crear en una transacción
        with transaction.atomic():
            # 1. Crear usuario Django
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=nombres,
                last_name=apellidos,
                is_active=is_active
            )

            # 2. Crear empleado
            empleado = AppkioskoEmpleados.objects.create(
                cedula=cedula,
                nombres=nombres,
                apellidos=apellidos,
                fecha_nacimiento=fecha_nacimiento if fecha_nacimiento else None,
                telefono=telefono,
                sexo=sexo,
                turno_trabajo=turno_trabajo,
                user=user
            )

            # 3. Asignar grupos/roles
            if grupos_ids:
                user.groups.set(grupos)

            # 4. ✅ ASIGNAR ESTABLECIMIENTO SOLO SI SE PROPORCIONA Y NO ES NULL
            if establecimiento_id is not None and establecimiento_id != '':
                try:
                    establecimiento = AppkioskoEstablecimientos.objects.get(id=establecimiento_id)
                    estado_activo = AppkioskoEstados.objects.filter(
                        nombre="Activo",
                        is_active=True
                    ).first()
                    
                    if not estado_activo:
                        estado_activo = AppkioskoEstados.objects.filter(is_active=True).first()
                    
                    if estado_activo:
                        AppkioskoEstablecimientosusuarios.objects.create(
                            establecimiento=establecimiento,
                            empleado=empleado,
                            fecha_inicio_trabajo=timezone.now(),
                            estado=estado_activo
                        )
                        print(f"✅ Empleado asignado al establecimiento: {establecimiento.nombre}")
                    else:
                        print("⚠️ No se encontró un estado activo para asignar")
                        
                except AppkioskoEstablecimientos.DoesNotExist:
                    print(f"⚠️ Establecimiento ID {establecimiento_id} no encontrado")
            else:
                print("ℹ️ No se asignó establecimiento (valor null o vacío)")

            # Log de éxito
            print(f"✅ USUARIO CREADO:")
            print(f"   - User ID: {user.id}")
            print(f"   - Empleado ID: {empleado.id}")
            print(f"   - Cédula: {empleado.cedula}")
            print(f"   - Username: {user.username}")
            print(f"   - Email: {user.email}")
            print(f"   - Grupos: {[g.name for g in user.groups.all()]}")
            print(f"   - Establecimiento: {establecimiento_id if establecimiento_id else 'No asignado'}")

            return Response({
                'message': 'Usuario creado exitosamente',
                'user_id': user.id,
                'empleado_id': empleado.id
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"❌ ERROR CREANDO USUARIO: {str(e)}")
        return Response({
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_empleados_lista(request):
    """Obtener lista de empleados con información básica"""

    # 🔐 Verificar permisos
    if not request.user.has_perm('auth.view_user'):
        return Response({
            'error': 'No tienes permisos para ver usuarios'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # Obtener empleados con información del usuario
        empleados = AppkioskoEmpleados.objects.select_related('user').all()

        empleados_data = []
        for empleado in empleados:
            if empleado.user:
                empleados_data.append({
                    'id': empleado.id,
                    'user_id': empleado.user.id,
                    'cedula': empleado.cedula,
                    'nombres': empleado.nombres,
                    'apellidos': empleado.apellidos,
                    'email': empleado.user.email,
                    'username': empleado.user.username,
                    'telefono': empleado.telefono,
                    'turno_trabajo': empleado.turno_trabajo,
                    'is_active': empleado.user.is_active,
                    'roles': [{'id': g.id, 'name': g.name} for g in empleado.user.groups.all()],
                    'fecha_registro': empleado.created_at.strftime('%Y-%m-%d') if empleado.created_at else None
                })

        return Response({
            'empleados': empleados_data,
            'total': len(empleados_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Error al obtener empleados: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def empleado_detalle_actualizar(request, empleado_id):
    """
    GET: Obtener detalles de un empleado
    PUT/PATCH: Actualizar información de un empleado
    """
    try:
        print(f"🔍 empleado_id recibido: {empleado_id}")  # DEBUG
        print(f"🔍 tipo de empleado_id: {type(empleado_id)}")  # DEBUG

        # 🔥 ASEGURAR que busque por el ID correcto
        user = User.objects.get(id=empleado_id)  # Debe usar empleado_id de la URL
        print(f"🔍 Usuario encontrado: {user.username} (ID: {user.id})")  # DEBUG

        # Buscar el empleado relacionado si existe
        try:
            empleado = AppkioskoEmpleados.objects.get(user=user)
        except AppkioskoEmpleados.DoesNotExist:
            empleado = None

        if request.method == 'GET':
            # 🔐 Verificar permisos
            if not request.user.has_perm('auth.view_user'):
                return Response({
                    'error': 'No tienes permisos para ver usuarios'
                }, status=status.HTTP_403_FORBIDDEN)

            # ✅ BUSCAR ESTABLECIMIENTO ACTUAL DEL EMPLEADO
            establecimiento_actual = None
            if empleado:
                relacion_activa = AppkioskoEstablecimientosusuarios.objects.filter(
                    empleado=empleado,
                    fecha_fin_trabajo__isnull=True
                ).select_related('establecimiento').first()
                
                if relacion_activa:
                    establecimiento_actual = {
                        'id': relacion_activa.establecimiento.id,
                        'nombre': relacion_activa.establecimiento.nombre,
                        'direccion': relacion_activa.establecimiento.direccion,
                        'fecha_inicio': relacion_activa.fecha_inicio_trabajo
                    }

            return Response({
                'empleado': {
                    'id': user.id,
                    'cedula': empleado.cedula if empleado else '',
                    'nombres': empleado.nombres if empleado else user.first_name,
                    'apellidos': empleado.apellidos if empleado else user.last_name,
                    'fecha_nacimiento': empleado.fecha_nacimiento if empleado else None,
                    'telefono': empleado.telefono if empleado else '',
                    'sexo': empleado.sexo if empleado else '',
                    'username': user.username,
                    'email': user.email,
                    'turno_trabajo': empleado.turno_trabajo if empleado else '',
                    'is_active': user.is_active,
                    'date_joined': user.date_joined,
                    'roles': [{'id': grupo.id, 'name': grupo.name} for grupo in user.groups.all()],
                    # ✅ AGREGAR ESTABLECIMIENTO ACTUAL
                    'establecimiento_actual': establecimiento_actual
                }
            }, status=status.HTTP_200_OK)

        elif request.method in ['PUT', 'PATCH']:
            # 🔐 Verificar permisos
            if not request.user.has_perm('auth.change_user'):
                return Response({
                    'error': 'No tienes permisos para actualizar usuarios'
                }, status=status.HTTP_403_FORBIDDEN)

            data = request.data

            # Actualizar campos del User
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            user.first_name = data.get('nombres', user.first_name)
            user.last_name = data.get('apellidos', user.last_name)
            user.is_active = data.get('isActive', user.is_active)

            # Actualizar contraseña solo si se proporciona
            if 'password' in data and data['password']:
                user.set_password(data['password'])

            # Actualizar grupos/roles
            if 'grupos' in data:
                grupos_ids = data['grupos']
                if grupos_ids:
                    grupos = Group.objects.filter(id__in=grupos_ids)
                    user.groups.set(grupos)

            user.save()

            if empleado:
                empleado.cedula = data.get('cedula', empleado.cedula)
                empleado.nombres = data.get('nombres', empleado.nombres)
                empleado.apellidos = data.get('apellidos', empleado.apellidos)
                empleado.fecha_nacimiento = data.get('fechaNacimiento', empleado.fecha_nacimiento)
                empleado.telefono = data.get('telefono', empleado.telefono)
                empleado.sexo = data.get('sexo', empleado.sexo)
                empleado.turno_trabajo = data.get('turnoTrabajo', empleado.turno_trabajo)
                empleado.save()

            # ✅ MANEJAR ESTABLECIMIENTO EN ACTUALIZACIÓN (PUEDE SER NULL)
            establecimiento_id = data.get('establecimiento')
            if empleado:
                if establecimiento_id is not None and establecimiento_id != '':
                    # Asignar establecimiento
                    try:
                        relacion_existente = AppkioskoEstablecimientosusuarios.objects.filter(
                            empleado=empleado,
                            fecha_fin_trabajo__isnull=True
                        ).first()

                        establecimiento = AppkioskoEstablecimientos.objects.get(id=establecimiento_id)
                        estado_activo = AppkioskoEstados.objects.filter(
                            nombre="Activo",
                            is_active=True
                        ).first()

                        if not estado_activo:
                            estado_activo = AppkioskoEstados.objects.filter(is_active=True).first()

                        if relacion_existente:
                            if relacion_existente.establecimiento.id != int(establecimiento_id):
                                relacion_existente.fecha_fin_trabajo = timezone.now()
                                relacion_existente.save()
                                
                                if estado_activo:
                                    AppkioskoEstablecimientosusuarios.objects.create(
                                        establecimiento=establecimiento,
                                        empleado=empleado,
                                        fecha_inicio_trabajo=timezone.now(),
                                        estado=estado_activo
                                    )
                                print(f"✅ Empleado reasignado al establecimiento: {establecimiento.nombre}")
                        else:
                            if estado_activo:
                                AppkioskoEstablecimientosusuarios.objects.create(
                                    establecimiento=establecimiento,
                                    empleado=empleado,
                                    fecha_inicio_trabajo=timezone.now(),
                                    estado=estado_activo
                                )
                            print(f"✅ Empleado asignado al establecimiento: {establecimiento.nombre}")

                    except AppkioskoEstablecimientos.DoesNotExist:
                        print(f"⚠️ Establecimiento ID {establecimiento_id} no encontrado")
                else:
                    # ✅ REMOVER ESTABLECIMIENTO (establecimiento_id es null o vacío)
                    relacion_existente = AppkioskoEstablecimientosusuarios.objects.filter(
                        empleado=empleado,
                        fecha_fin_trabajo__isnull=True
                    ).first()
                    
                    if relacion_existente:
                        relacion_existente.fecha_fin_trabajo = timezone.now()
                        relacion_existente.save()
                        print(f"✅ Empleado removido del establecimiento: {relacion_existente.establecimiento.nombre}")

            return Response({
                'mensaje': 'Empleado actualizado exitosamente',
                'empleado': {
                    'id': user.id,
                    'nombres': empleado.nombres if empleado else user.first_name,
                    'apellidos': empleado.apellidos if empleado else user.last_name,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({
            'error': 'Empleado no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_empleado(request, empleado_id):
    """Eliminar empleado y sus relaciones"""
    try:
        user = User.objects.get(id=empleado_id)
        
        # 🧹 LIMPIAR RELACIONES ANTES DE ELIMINAR
        try:
            empleado = AppkioskoEmpleados.objects.get(user=user)
            
            # Finalizar relaciones activas
            relaciones_activas = AppkioskoEstablecimientosusuarios.objects.filter(
                empleado=empleado,
                fecha_fin_trabajo__isnull=True
            )
            
            for relacion in relaciones_activas:
                relacion.fecha_fin_trabajo = timezone.now()
                relacion.save()
                
            print(f"✅ {relaciones_activas.count()} relaciones finalizadas")
            
        except AppkioskoEmpleados.DoesNotExist:
            pass
        
        # Eliminar usuario (esto eliminará el empleado si usas CASCADE)
        user.delete()
        
        return Response({
            'message': 'Usuario eliminado correctamente'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_empleados_para_establecimiento(request):
    """Obtener empleados con sus roles para dropdown de establecimiento"""

    # 🔐 Verificar permisos
    if not request.user.has_perm('auth.view_user'):
        return Response({
            'error': 'No tienes permisos para ver usuarios'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # Obtener empleados activos con usuario y roles
        empleados = AppkioskoEmpleados.objects.select_related('user').filter(
            user__is_active=True,
            user__isnull=False
        ).order_by('nombres', 'apellidos')

        empleados_data = []
        for empleado in empleados:
            # Obtener el rol principal del empleado
            rol_principal = empleado.user.groups.first()

            empleados_data.append({
                'id': empleado.id,
                'user_id': empleado.user.id,
                'nombres': empleado.nombres,
                'apellidos': empleado.apellidos,
                'nombre_completo': f"{empleado.nombres} {empleado.apellidos}",
                'cargo': rol_principal.name if rol_principal else 'Sin rol asignado',
                'cedula': empleado.cedula,
                'telefono': empleado.telefono,
                'email': empleado.user.email
            })

        return Response({
            'empleados': empleados_data,
            'total': len(empleados_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"❌ ERROR obteniendo empleados: {str(e)}")
        return Response({
            'error': f'Error al obtener empleados: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)