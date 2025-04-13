from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import AuthUserViewSet

router = DefaultRouter()
router.register(r'usuarios', AuthUserViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
