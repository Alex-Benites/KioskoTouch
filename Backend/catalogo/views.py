from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models import AppkioskoProductos,AppkioskoCategorias
from .serializers import ProductoSerializer,CategoriaSerializer
from comun.models import AppkioskoEstados,AppkioskoImagen # Asumiendo que AppkioskoEstados está en la app 'comun'
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view
# Create your views here.

class ProductoListCreateAPIView(generics.ListCreateAPIView):
    queryset = AppkioskoProductos.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = (MultiPartParser, FormParser)

class CategoriaListView(generics.ListAPIView):
    queryset = AppkioskoCategorias.objects.all()
    serializer_class = CategoriaSerializer

@api_view(['GET'])
def get_producto_imagen(request, producto_id):
    try:
        imagen = AppkioskoImagen.objects.get(
            categoria_imagen='productos',
            entidad_relacionada_id=producto_id
        )
        return Response({'imagen_url': imagen.ruta})
    except AppkioskoImagen.DoesNotExist:
        return Response({'imagen_url': None})