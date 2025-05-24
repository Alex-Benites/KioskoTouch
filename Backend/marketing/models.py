from django.db import models
# from apps.comun.models import AppkioskoEstados
# from apps.usuarios.models import AppkioskoClientes
# from apps.catalogo.models import AppkioskoCategorias, AppkioskoMenus, AppkioskoProductos
# from apps.establecimientos.models import AppkioskoEstablecimientos, AppkioskoKioskostouch

class AppkioskoPromociones(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    valor_descuento = models.IntegerField()
    fecha_iniciopromo = models.DateTimeField(db_column='fecha_inicioPromo')
    fecha_finpromo = models.DateTimeField(db_column='fecha_finPromo', blank=True, null=True)
    tipo_promocion = models.CharField(max_length=50, blank=True, null=True)
    codigo_promocional = models.CharField(max_length=50, blank=True, null=True)
    limite_uso_usuario = models.IntegerField(blank=True, null=True)
    aplicable_a = models.CharField(max_length=100, blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True)
    limite_uso_total = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'appkiosko_promociones'
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'

    def __str__(self):
        return self.nombre

class AppkioskoCupon(models.Model):
    codigo = models.CharField(unique=True, max_length=50)
    descuento = models.DecimalField(max_digits=5, decimal_places=2)
    fecha_creacioncupon = models.DateTimeField(db_column='fecha_creacionCupon', blank=True, null=True)
    fecha_fincupon = models.DateTimeField(db_column='fecha_finCupon', blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    cliente = models.ForeignKey('usuarios.AppkioskoClientes', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    # promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.SET_NULL, blank=True, null=True) # Si un cupón puede estar ligado a una promo específica

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_cupon'
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'

    def __str__(self):
        return self.codigo

class AppkioskoPublicidades(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo_publicidad = models.CharField(max_length=100, blank=True, null=True)
    imagen_or_video_url = models.CharField(db_column='imagen_or_video_URL', max_length=500, blank=True, null=True) # Considerar eliminar si se usan AppkioskoImagen/Video
    fecha_iniciopublicidad = models.DateTimeField(db_column='fecha_inicioPublicidad', blank=True, null=True)
    fecha_finpublicidad = models.DateTimeField(db_column='fecha_finPublicidad', blank=True, null=True)
    estado = models.ForeignKey('comun.AppkioskoEstados', on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.SET_NULL, blank=True, null=True) # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    establecimientos_asignados = models.ManyToManyField(
        'establecimientos.AppkioskoEstablecimientos',
        through='AppkioskoPublicidadestablecimiento',
        related_name='publicidades_mostradas_est' # Nombre de relación único
    )
    kioskos_asignados = models.ManyToManyField(
        'establecimientos.AppkioskoKioskostouch',
        through='AppkioskoPublicidadkioskotouch',
        related_name='publicidades_mostradas_kio' # Nombre de relación único
    )

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_publicidades'
        verbose_name = 'Publicidad'
        verbose_name_plural = 'Publicidades'

    def __str__(self):
        return self.nombre

class AppkioskoImagen(models.Model):
    nombre = models.CharField(max_length=100)
    ruta = models.CharField(max_length=500) # Considerar ImageField si managed=True
    categoria_imagen = models.CharField(max_length=100, blank=True, null=True)
    codigo_referencial_imagen = models.IntegerField(blank=True, null=True)
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE, blank=True, null=True, related_name="imagenes") # Añadido
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_imagen'
        verbose_name = 'Imagen de Publicidad'
        verbose_name_plural = 'Imágenes de Publicidad'

    def __str__(self):
        return self.nombre

class AppkioskoVideo(models.Model):
    nombre = models.CharField(max_length=100)
    ruta = models.CharField(max_length=500) # Considerar FileField si managed=True
    duracion = models.IntegerField()
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE, blank=True, null=True, related_name="videos") # Ajustar on_delete
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_video'
        verbose_name = 'Video de Publicidad'
        verbose_name_plural = 'Videos de Publicidad'

    def __str__(self):
        return self.nombre

# --- Tablas Intermedias para Promociones ---
class AppkioskoPromocioncategoria(models.Model):
    # categoria = models.OneToOneField('catalogo.AppkioskoCategorias', models.DO_NOTHING, primary_key=True) # ANTERIOR
    # promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING) # ANTERIOR
    categoria = models.ForeignKey('catalogo.AppkioskoCategorias', on_delete=models.CASCADE) # CORREGIDO
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.CASCADE) # CORREGIDO
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_promocioncategoria'
        unique_together = (('categoria', 'promocion'),)
        verbose_name = 'Promoción por Categoría'

class AppkioskoPromocionmenu(models.Model):
    # menu = models.OneToOneField('catalogo.AppkioskoMenus', models.DO_NOTHING, primary_key=True) # ANTERIOR
    # promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING) # ANTERIOR
    menu = models.ForeignKey('catalogo.AppkioskoMenus', on_delete=models.CASCADE) # CORREGIDO
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.CASCADE) # CORREGIDO
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_promocionmenu'
        unique_together = (('menu', 'promocion'),)
        verbose_name = 'Promoción por Menú'

class AppkioskoPromocionproductos(models.Model):
    # producto = models.OneToOneField('catalogo.AppkioskoProductos', models.DO_NOTHING, primary_key=True) # ANTERIOR
    # promocion = models.ForeignKey(AppkioskoPromociones, models.DO_NOTHING) # ANTERIOR
    producto = models.ForeignKey('catalogo.AppkioskoProductos', on_delete=models.CASCADE) # CORREGIDO
    promocion = models.ForeignKey(AppkioskoPromociones, on_delete=models.CASCADE) # CORREGIDO
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_promocionproductos'
        unique_together = (('producto', 'promocion'),)
        verbose_name = 'Promoción por Producto'

# --- Tablas Intermedias para Publicidad ---
class AppkioskoPublicidadestablecimiento(models.Model):
    # establecimiento = models.OneToOneField('establecimientos.AppkioskoEstablecimientos', models.DO_NOTHING, primary_key=True) # ANTERIOR
    # publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING) # ANTERIOR
    establecimiento = models.ForeignKey('establecimientos.AppkioskoEstablecimientos', on_delete=models.CASCADE) # CORREGIDO
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE) # CORREGIDO
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_publicidadestablecimiento'
        unique_together = (('establecimiento', 'publicidad'),)
        verbose_name = 'Publicidad por Establecimiento'

class AppkioskoPublicidadkioskotouch(models.Model):
    # kioskotouch = models.OneToOneField('establecimientos.AppkioskoKioskostouch', models.DO_NOTHING, db_column='kioskoTouch_id', primary_key=True) # ANTERIOR
    # publicidad = models.ForeignKey(AppkioskoPublicidades, models.DO_NOTHING) # ANTERIOR
    kioskotouch = models.ForeignKey('establecimientos.AppkioskoKioskostouch', on_delete=models.CASCADE, db_column='kioskoTouch_id') # CORREGIDO
    publicidad = models.ForeignKey(AppkioskoPublicidades, on_delete=models.CASCADE) # CORREGIDO
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False # Manteniendo tu indicación
        db_table = 'appkiosko_publicidadkioskotouch'
        unique_together = (('kioskotouch', 'publicidad'),)
        verbose_name = 'Publicidad por Kiosko'