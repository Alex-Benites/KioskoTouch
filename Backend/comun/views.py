from rest_framework import generics
from .models import AppkioskoEstados  # Ajusta según la ubicación de tu modelo
from .serializers import EstadosSerializer  # Ajusta según la ubicación de tu serializer

class EstadosListView(generics.ListAPIView):
    queryset = AppkioskoEstados.objects.all()
    serializer_class = EstadosSerializer
