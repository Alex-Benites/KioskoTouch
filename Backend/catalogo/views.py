from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models import AppkioskoProductos
from .serializers import ProductoSerializer
from rest_framework.parsers import MultiPartParser, FormParser
# Create your views here.

class ProductoListCreateAPIView(generics.ListCreateAPIView):
    queryset = AppkioskoProductos.objects.all()
    serializer_class = ProductoSerializer
    parser_classes = (MultiPartParser, FormParser)