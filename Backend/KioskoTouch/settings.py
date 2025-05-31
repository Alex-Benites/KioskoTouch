from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-va0!@(g=u78w+lo7_1-(*zu1cd)nssw!bvu@xbgik0ko&b(brn'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

#ALLOWED_HOSTS = ['KioskoGo.pythonanywhere.com']
ALLOWED_HOSTS = [] #esto para trabajar de manera remota

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    #app main que deberia ser borrada a futuro
    #'main',

    # terceros
    'rest_framework',
    'rest_framework_simplejwt',
    #'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # apps
    'comun.apps.ComunConfig',
    'usuarios.apps.UsuariosConfig',
    'catalogo.apps.CatalogoConfig',
    'ventas.apps.VentasConfig',
    'marketing.apps.MarketingConfig',
    'establecimientos.apps.EstablecimientosConfig',

]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'KioskoTouch.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'main' / 'templates'],

        #'DIRS': [BASE_DIR / 'main' / 'templates', BASE_DIR / 'main' / 'templates' / 'cliente', BASE_DIR / 'main' / 'templates' / 'chef', BASE_DIR / 'main' / 'templates' / 'administrador' ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'KioskoTouch.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# base de datos local

DATABASES = {
   'default': {
       'ENGINE': 'django.db.backends.mysql',
       'NAME': 'kioskoGo_db',
       'USER': 'root',  # Tratar de tener las mismas credenciales para no tener que cambiar nada cada vez que se haga un commit
       'PASSWORD': 'root',  # Tratar de tener las mismas credenciales para no tener que cambiar nada cada vez que se haga un commit
       'HOST': 'localhost',
       'PORT': '3306',
   }
}

#Para comentar codigo ctrl+k luego ctrl+c y para descomentar ctrl+k luego ctrl+u
# Base de datos para usar en pythonAnywhere
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'KioskoGo$db',  # Usa el nombre completo de la base de datos
#         'USER': 'KioskoGo',
#         'PASSWORD': 'root2002',
#         'HOST': 'KioskoGo.mysql.pythonanywhere-services.com',
#         'PORT': '3306',
#     }
# }

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# 🆕 CONFIGURACIÓN DE JWT
SIMPLE_JWT = {
    # TIEMPOS DE VIDA
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),     # 60 minutos
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),        # 7 días

    # SEGURIDAD CON ROTACIÓN (POR AHORA DESHABILITADA)
    'ROTATE_REFRESH_TOKENS': False,                      # Nuevo refresh token cada vez
    'BLACKLIST_AFTER_ROTATION': False,                   # Invalidar tokens viejos

    # CONFIGURACIÓN DE SEGURIDAD
    'UPDATE_LAST_LOGIN': False,                         # No actualizar last_login
    'ALGORITHM': 'HS256',                               # Algoritmo de encriptación
    'SIGNING_KEY': SECRET_KEY,                          # Usar SECRET_KEY de Django

    # CONFIGURACIÓN DE HEADERS
    'AUTH_HEADER_TYPES': ('Bearer',),                  # "Authorization: Bearer <token>"
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    # CLAIMS DEL TOKEN
    'USER_ID_FIELD': 'id',                             # Campo del User model
    'USER_ID_CLAIM': 'user_id',                        # Nombre del claim
    'TOKEN_TYPE_CLAIM': 'token_type',                  # access/refresh
    'JTI_CLAIM': 'jti',                                # Para blacklist

    # CLASES DE TOKEN
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),

    # REGLAS DE AUTENTICACIÓN
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    # OPCIONALES (valores por defecto)
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'
TIME_ZONE = 'America/Guayaquil'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

STATICFILES_DIRS = [
    BASE_DIR / STATIC_URL,
    os.path.join(BASE_DIR, 'frontend/dist/frontend/browser'),

]

#STATIC_ROOT = "assets/"

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]

CORS_ALLOW_CREDENTIALS = True

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'


FRONTEND_URL = 'http://localhost:4200'  # Para que coincida con CORS

# Email configuration - CONSOLA (para pruebas)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'samuellindaochoez2021@gmail.com'
EMAIL_HOST_PASSWORD = 'iphc gdzl xljc gtuo'
DEFAULT_FROM_EMAIL = 'samuellindaochoez2021@gmail.com'
