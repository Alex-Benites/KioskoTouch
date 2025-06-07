from rest_framework import serializers
from .models import AppkioskoEstablecimientos
from comun.models import AppkioskoImagen, AppkioskoEstados
from django.conf import settings
import os
import uuid

class EstablecimientoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()
    imagen = serializers.ImageField(write_only=True, required=False)
    responsable_id = serializers.IntegerField(write_only=True, required=False)
    estado_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = AppkioskoEstablecimientos
        fields = [
            'id', 'nombre', 'tipo_establecimiento', 'provincia', 'ciudad',
            'direccion', 'telefono', 'correo',
            'responsable_asignado', 'responsable_id',
            'estado', 'estado_id',
            'imagen', 'imagen_url',
            'created_at', 'updated_at'
        ]

    def get_imagen_url(self, obj):
        if obj.imagen:
            return obj.imagen.ruta
        return None

    def create(self, validated_data):
        responsable_id = validated_data.pop('responsable_id', None)
        estado_id = validated_data.pop('estado_id', None)
        imagen = validated_data.pop('imagen', None)

        if responsable_id:
            from usuarios.models import AppkioskoEmpleados
            validated_data['responsable_asignado'] = AppkioskoEmpleados.objects.get(id=responsable_id)
        if estado_id:
            validated_data['estado'] = AppkioskoEstados.objects.get(id=estado_id)

        establecimiento = AppkioskoEstablecimientos.objects.create(**validated_data)

        if imagen:
            imagen_obj = self._crear_imagen_establecimiento(establecimiento, imagen)
            establecimiento.imagen = imagen_obj
            establecimiento.save()

        return establecimiento

    def update(self, instance, validated_data):
        print("IMAGEN EN UPDATE:", validated_data.get('imagen'))
        responsable_id = validated_data.pop('responsable_id', None)
        estado_id = validated_data.pop('estado_id', None)
        imagen = validated_data.pop('imagen', None)

        if responsable_id:
            from usuarios.models import AppkioskoEmpleados
            instance.responsable_asignado = AppkioskoEmpleados.objects.get(id=responsable_id)
        if estado_id:
            from comun.models import AppkioskoEstados
            instance.estado = AppkioskoEstados.objects.get(id=estado_id)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if imagen:
            # Elimina la imagen anterior y asocia la nueva
            if instance.imagen:
                self._eliminar_imagen_anterior(instance)
            imagen_obj = self._crear_imagen_establecimiento(instance, imagen)
            instance.imagen = imagen_obj
            instance.save()

        return instance

    def _crear_imagen_establecimiento(self, establecimiento, imagen):
        directorio = os.path.join(settings.MEDIA_ROOT, 'establecimientos')
        os.makedirs(directorio, exist_ok=True)
        extension = imagen.name.split('.')[-1] if '.' in imagen.name else 'jpg'
        nombre_archivo = f"establecimiento_{establecimiento.id}_{uuid.uuid4().hex[:8]}.{extension}"
        ruta_fisica = os.path.join(directorio, nombre_archivo)
        with open(ruta_fisica, 'wb+') as destination:
            for chunk in imagen.chunks():
                destination.write(chunk)
        ruta_relativa = f"/media/establecimientos/{nombre_archivo}"
        imagen_obj = AppkioskoImagen.objects.create(
            ruta=ruta_relativa,
            categoria_imagen='establecimientos',
            entidad_relacionada_id=establecimiento.id
        )
        return imagen_obj

    def _eliminar_imagen_anterior(self, instance):
        imagen_anterior = instance.imagen
        if imagen_anterior and imagen_anterior.ruta:
            ruta_fisica = os.path.join(settings.MEDIA_ROOT, imagen_anterior.ruta.lstrip('/media/'))
            if os.path.exists(ruta_fisica):
                os.remove(ruta_fisica)
            imagen_anterior.delete()
        instance.imagen = None
        instance.save()