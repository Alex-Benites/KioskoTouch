from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models import AppkioskoProductos,AppkioskoCategorias
from .serializers import ProductoSerializer,CategoriaSerializer
from comun.models import AppkioskoEstados # Asumiendo que AppkioskoEstados está en la app 'comun'
from rest_framework.parsers import MultiPartParser, FormParser
# Create your views here.

class ProductoListCreateAPIView(generics.ListCreateAPIView):
    queryset = AppkioskoProductos.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = (MultiPartParser, FormParser)

class CategoriaListView(generics.ListAPIView):
    queryset = AppkioskoCategorias.objects.all()
    serializer_class = CategoriaSerializer

