from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


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
    'main',
    'rest_framework',
    'corsheaders',
    
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = 'KioskoTouch.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'main' / 'templates', BASE_DIR / 'main' / 'templates' / 'cliente', BASE_DIR / 'main' / 'templates' / 'chef', BASE_DIR / 'main' / 'templates' / 'administrador' ],
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
       'NAME': 'kiosko_db',
       'USER': 'root',
       'PASSWORD': 'root2002',
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

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

STATICFILES_DIRS = [
    BASE_DIR / STATIC_URL,
    #BASE_DIR / 'frontend-cliente/dist/frontend-cliente',
    #os.path.join(BASE_DIR, 'frontend-cliente/dist/frontend-cliente/browser' ),
    os.path.join(BASE_DIR, 'frontend-chef', 'dist', 'frontend-chef', 'browser'),
    os.path.join(BASE_DIR, 'frontend-cliente', 'dist', 'frontend-cliente', 'browser'),
    os.path.join(BASE_DIR, 'frontend-administrador', 'dist', 'frontend-administrador', 'browser'),
]

#STATIC_ROOT = "assets/"

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') 

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
