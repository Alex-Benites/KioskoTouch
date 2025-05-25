from django.apps import AppConfig
from pathlib import Path


class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.AutoField'
    name = 'main'
    path = str(Path(__file__).resolve().parent)
