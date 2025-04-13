from rest_framework import viewsets
from main.models import AuthUser
from .serializers import AuthUserSerializer

class AuthUserViewSet(viewsets.ModelViewSet):
    queryset = AuthUser.objects.all()
    serializer_class = AuthUserSerializer


# Create your views here.
