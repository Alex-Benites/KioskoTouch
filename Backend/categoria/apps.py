# ✅ Backend/categoria/apps.py
from django.apps import AppConfig

class CategoriaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'categoria'
    verbose_name = 'Gestión de Categorías'