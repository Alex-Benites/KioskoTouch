from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Analizar permisos duplicados y recomendar cuáles usar'

    def handle(self, *args, **options):
        print("\n🎉 ¡COMANDO FUNCIONANDO!")
        
        modelos = [
            'user', 'appkioskoproductos', 'appkioskomenus', 
            'appkioskopromociones', 'appkioskopantallascocina',
            'appkioskoestablecimientos', 'appkioskopublicidades', 
            'appkioskokioskostouch'
        ]
        
        print("\n" + "="*100)
        print("🔍 ANÁLISIS DE PERMISOS DUPLICADOS")
        print("="*100)
        
        recomendaciones = {}
        
        for modelo in modelos:
            print(f"\n📁 MODELO: {modelo}")
            print("-" * 60)
            
            # Obtener content types para este modelo
            content_types = ContentType.objects.filter(model=modelo)
            
            if content_types.count() > 1:
                print(f"⚠️ DUPLICADOS DETECTADOS: {content_types.count()} content types")
                
                mejor_opcion = None
                max_en_uso = 0
                
                for ct in content_types:
                    permisos = Permission.objects.filter(content_type=ct)
                    permisos_en_uso = self.verificar_permisos_en_uso(permisos)
                    
                    print(f"\n   📂 ContentType ID: {ct.id} | App: {ct.app_label}")
                    print(f"      Permisos totales: {permisos.count()}")
                    print(f"      Permisos en uso: {len(permisos_en_uso)}")
                    print(f"      Creado: {ct.id} (ID mayor = más reciente)")
                    
                    # Determinar la mejor opción
                    if len(permisos_en_uso) > max_en_uso:
                        mejor_opcion = ct
                        max_en_uso = len(permisos_en_uso)
                    elif len(permisos_en_uso) == max_en_uso and ct.id > (mejor_opcion.id if mejor_opcion else 0):
                        mejor_opcion = ct
                    
                    # Mostrar permisos
                    for p in permisos.order_by('codename'):
                        en_uso = "✅ EN USO" if p.id in permisos_en_uso else "❌ Sin usar"
                        print(f"         ID:{p.id} | {p.codename} | {en_uso}")
                        
                # Recomendación
                if mejor_opcion:
                    print(f"\n   🎯 RECOMENDADO: ContentType ID {mejor_opcion.id} ({mejor_opcion.app_label})")
                    recomendaciones[modelo] = mejor_opcion.id
                else:
                    # Si ninguno está en uso, usar el más reciente
                    ct_reciente = content_types.order_by('-id').first()
                    print(f"\n   🎯 RECOMENDADO: ContentType ID {ct_reciente.id} (más reciente)")
                    recomendaciones[modelo] = ct_reciente.id
                            
            else:
                print("✅ Sin duplicados")
                ct = content_types.first()
                if ct:
                    permisos = Permission.objects.filter(content_type=ct)
                    print(f"   ContentType ID: {ct.id} | Permisos: {permisos.count()}")
                    recomendaciones[modelo] = ct.id

        # Resumen final
        print("\n" + "="*100)
        print("📊 RESUMEN DE RECOMENDACIONES")
        print("="*100)
        for modelo, ct_id in recomendaciones.items():
            ct = ContentType.objects.get(id=ct_id)
            print(f"✅ {modelo}: ContentType ID {ct_id} ({ct.app_label}.{ct.model})")

    def verificar_permisos_en_uso(self, permisos):
        """Verificar qué permisos están siendo usados"""
        permisos_en_uso = set()
        
        for permiso in permisos:
            # Verificar si está en user_permissions
            if permiso.user_set.exists():
                permisos_en_uso.add(permiso.id)
            
            # Verificar si está en group_permissions  
            if permiso.group_set.exists():
                permisos_en_uso.add(permiso.id)
                
        return permisos_en_uso