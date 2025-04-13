import os
import shutil
import re
from django.core.management.base import BaseCommand

FRONTEND_PROJECTS = [
    ('frontend-cliente', 'main/templates/cliente/cliente_index.html'),
    ('frontend-chef', 'main/templates/chef/chef_index.html'),
    ('frontend-administrador', 'main/templates/administrador/admin_index.html'),
]

class Command(BaseCommand):
    help = 'Copia los index.html de Angular y reemplaza rutas por static para Django'

    def handle(self, *args, **kwargs):
        for project, destination in FRONTEND_PROJECTS:
            build_index_path = os.path.join(project, 'dist', project, 'browser', 'index.html')

            if os.path.exists(build_index_path):
                shutil.copyfile(build_index_path, destination)
                self.stdout.write(self.style.SUCCESS(f"✅ Copiado: {destination}"))

                with open(destination, 'r', encoding='utf-8') as f:
                    content = f.read()

                content = '{% load static %}\n' + content

                def django_static_replacement(match):
                    tag = match.group(1)
                    file = match.group(2)
                    return f'{tag}="{{% static \'{file}\' %}}"'

                pattern = r'(href|src)="([^"]+\.(css|js|ico))"'
                content = re.sub(pattern, django_static_replacement, content)

                with open(destination, 'w', encoding='utf-8') as f:
                    f.write(content)

                self.stdout.write(self.style.SUCCESS(
                    f"✅ Rutas static procesadas correctamente para {project}"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"❌ No encontrado: {build_index_path}. Ejecuta 'ng build' primero."
                ))
