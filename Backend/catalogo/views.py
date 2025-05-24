from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from .models import AppkioskoProductos
from .serializers import ProductoSerializer

# Create your views here.

class ProductoListCreateAPIView(generics.ListCreateAPIView):
    queryset = AppkioskoProductos.objects.all()
    serializer_class = ProductoSerializer