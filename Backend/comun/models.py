from django.db import models

class AppkioskoEstados(models.Model):
    nombre = models.CharField(max_length=100, default='Estado Desconocido')
    is_active = models.BooleanField(default=True)
    is_eliminated = models.BooleanField(default=False)
    is_inactive = models.BooleanField(default=False)
    is_order_preparing = models.BooleanField(default=False)
    is_order_finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_estados'
        verbose_name = 'Estado'
        verbose_name_plural = 'Estados'

    def __str__(self):
        return self.nombre

class AppkioskoTipopago(models.Model):
    nombre = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_tipopago'
        verbose_name = 'Tipo de Pago'
        verbose_name_plural = 'Tipos de Pago'

    def __str__(self):
        return self.nombre

class AppkioskoImagen(models.Model):
    CATEGORIA_CHOICES = [
        ('productos', 'Productos'),
        ('ingredientes', 'Ingredientes'),
        ('menu', 'Menú'),
        ('publicidad', 'Publicidad'),
        ('categorias', 'Categorías'),
        ('establecimientos', 'Establecimientos'),

    ]

    ruta = models.CharField(max_length=500)
    categoria_imagen = models.CharField(
        max_length=100,
        choices=CATEGORIA_CHOICES,
        blank=True,
        null=True
    )
    entidad_relacionada_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_imagen'
        verbose_name = 'Imagen'
        verbose_name_plural = 'Imágenes'

    def __str__(self):
        return f"Imagen {self.id} - {self.get_categoria_imagen_display()}"


class AppkioskoIva(models.Model):
    # ===== CONFIGURACIÓN TRIBUTARIA =====
    porcentaje_iva = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name="Porcentaje de IVA"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )
    
    # ===== DATOS EMPRESARIALES =====
    ruc = models.CharField(
        max_length=13,
        verbose_name="RUC",
        help_text="RUC de la empresa (13 dígitos)",
        blank=True,
        null=True
    )
    razon_social = models.CharField(
        max_length=300,
        verbose_name="Razón Social",
        help_text="Nombre legal de la empresa",
        blank=True,
        null=True
    )
    nombre_comercial = models.CharField(
        max_length=300,
        verbose_name="Nombre Comercial",
        help_text="Nombre comercial del establecimiento",
        blank=True,
        null=True
    )
    
    # ===== UBICACIÓN =====
    direccion = models.TextField(
        verbose_name="Dirección",
        help_text="Dirección completa del establecimiento",
        blank=True,
        null=True
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name="Ciudad",
        blank=True,
        null=True
    )
    provincia = models.CharField(
        max_length=100,
        verbose_name="Provincia",
        blank=True,
        null=True
    )
    codigo_postal = models.CharField(
        max_length=10,
        verbose_name="Código Postal",
        blank=True,
        null=True
    )
    
    # ===== CONTACTO =====
    telefono = models.CharField(
        max_length=20,
        verbose_name="Teléfono",
        blank=True,
        null=True
    )
    email = models.EmailField(
        verbose_name="Email",
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'appkiosko_iva'
        verbose_name = 'Configuración Empresarial'
        verbose_name_plural = 'Configuración Empresarial'

    def __str__(self):
        estado = "ACTIVO" if self.activo else "INACTIVO"
        nombre = self.nombre_comercial or self.razon_social or "Sin nombre"
        return f"{nombre} - IVA {self.porcentaje_iva}% - {estado}"

    def save(self, *args, **kwargs):
        # Solo una configuración puede estar activa a la vez
        if self.activo:
            AppkioskoIva.objects.filter(activo=True).update(activo=False)
        super().save(*args, **kwargs)

    @classmethod 
    def get_configuracion_actual(cls):
        """Obtener la configuración empresarial actual"""
        config_actual = cls.objects.filter(activo=True).first()
        return config_actual

    @classmethod 
    def get_porcentaje_actual(cls):
        """Obtener el porcentaje del IVA actual"""
        config = cls.get_configuracion_actual()
        return config.porcentaje_iva if config else 15.00

    @classmethod
    def get_datos_empresa(cls):
        """Obtener datos completos de la empresa para facturas"""
        config = cls.get_configuracion_actual()
        if not config:
            return {
                'ruc': '1791310199001',
                'razon_social': 'KIOSKO TOUCH',
                'nombre_comercial': 'Kiosko de Autoservicio',
                'direccion': 'Dirección no configurada',
                'ciudad': 'Ciudad no configurada',
                'telefono': 'Teléfono no configurado',
                'email': 'email@no-configurado.com',
                'porcentaje_iva': 15.00
            }
        
        return {
            'ruc': config.ruc or '1791310199001',
            'razon_social': config.razon_social or 'KIOSKO TOUCH',
            'nombre_comercial': config.nombre_comercial or 'Kiosko de Autoservicio',
            'direccion': config.direccion or 'Dirección no configurada',
            'ciudad': config.ciudad or 'Ciudad no configurada',
            'provincia': config.provincia or '',
            'telefono': config.telefono or '',
            'email': config.email or '',
            'porcentaje_iva': config.porcentaje_iva
        }

    def clean(self):
        """Validaciones personalizadas"""
        from django.core.exceptions import ValidationError
        
        # Validar RUC ecuatoriano (13 dígitos)
        if self.ruc and len(self.ruc) != 13:
            raise ValidationError({'ruc': 'El RUC debe tener exactamente 13 dígitos'})
        
        # Validar que el porcentaje sea positivo
        if self.porcentaje_iva and self.porcentaje_iva < 0:
            raise ValidationError({'porcentaje_iva': 'El porcentaje de IVA no puede ser negativo'})

    @classmethod
    def activar_o_crear_iva(cls, porcentaje):
        """
        ✅ NUEVO: Activar IVA existente o crear uno nuevo
        """
        try:
            from django.db import transaction

            with transaction.atomic():
                # Buscar si ya existe un IVA con ese porcentaje
                iva_existente = cls.objects.filter(porcentaje_iva=porcentaje).first()

                if iva_existente:
                    # ✅ REUTILIZAR: Activar el IVA existente
                    print(f"🔄 Reactivando IVA existente de {porcentaje}%")

                    # Desactivar todos los demás
                    cls.objects.filter(activo=True).update(activo=False)

                    # Activar el existente
                    iva_existente.activo = True
                    iva_existente.save()

                    return iva_existente, False  # False = no creado, reactivado
                else:
                    # ✅ CREAR: Nuevo IVA con porcentaje diferente
                    print(f"🆕 Creando nuevo IVA de {porcentaje}%")

                    # Desactivar todos los demás
                    cls.objects.filter(activo=True).update(activo=False)

                    # Crear nuevo IVA
                    nuevo_iva = cls.objects.create(
                        porcentaje_iva=porcentaje,
                        activo=True
                    )

                    return nuevo_iva, True  # True = creado nuevo

        except Exception as e:
            print(f"❌ Error en activar_o_crear_iva: {e}")
            raise e

