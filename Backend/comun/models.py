from django.db import models

class AppkioskoEstados(models.Model):
    nombre = models.CharField(
        max_length=100,
        default="Estado Desconocido",
        help_text="Nombre descriptivo del estado (ej: Disponible, Agotado)"
    )
    is_active = models.BooleanField(
        default=False, 
        help_text="¿Este estado implica que la entidad está activa/operativa?"
    )
    is_eliminated = models.BooleanField(
        default=False,
        help_text="¿Este estado implica que la entidad está lógicamente eliminada?"
    )
    is_inactive = models.BooleanField(
        default=False, 
        help_text="¿Este estado implica que la entidad está temporalmente inactiva pero no eliminada?"
    )

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        #managed = False
        db_table = 'appkiosko_estados'
        verbose_name = 'Estado Kiosko'
        verbose_name_plural = 'Estados Kiosko'
        ordering = ['nombre'] 

    def __str__(self):
        return self.nombre 
