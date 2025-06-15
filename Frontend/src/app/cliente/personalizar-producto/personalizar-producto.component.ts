import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personalizar-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalizar-producto.component.html',
  styleUrls: ['./personalizar-producto.component.scss']
})
export class PersonalizarProductoComponent implements OnInit {

  // ✅ Inject services
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ✅ Propiedades del componente
  productoId: number | null = null;
  cantidad: number = 1;
  nombreProducto: string = '';
  precioProducto: number = 0;
  categoriaProducto: number | null = null;

  ngOnInit(): void {
    // ✅ Obtener ID del producto desde la URL
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));

    // ✅ Obtener parámetros adicionales desde queryParams
    this.route.queryParams.subscribe(params => {
      this.cantidad = Number(params['cantidad']) || 1;
      this.nombreProducto = params['nombre'] || '';
      this.precioProducto = Number(params['precio']) || 0;
      this.categoriaProducto = Number(params['categoria']) || null;

      console.log('🎨 Datos recibidos para personalización:', {
        id: this.productoId,
        cantidad: this.cantidad,
        nombre: this.nombreProducto,
        precio: this.precioProducto,
        categoria: this.categoriaProducto
      });

      // ✅ Cargar datos del producto si es necesario
      this.cargarProductoParaPersonalizar();
    });
  }

  // ✅ Método para cargar datos adicionales del producto
  private cargarProductoParaPersonalizar(): void {
    if (!this.productoId) {
      console.error('❌ No se proporcionó ID de producto');
      this.volverAlMenu();
      return;
    }

    // Aquí puedes cargar ingredientes, opciones de personalización, etc.
    console.log(`🔍 Cargando datos de personalización para producto ${this.productoId}`);

    // Ejemplo de carga de datos:
    // this.catalogoService.getProductoDetalle(this.productoId).subscribe(...)
    // this.catalogoService.getIngredientesPersonalizacion(this.productoId).subscribe(...)
  }

  // ✅ Método para volver al menú
  volverAlMenu(): void {
    this.router.navigate(['/cliente/menu']);
  }

  // ✅ Método para agregar producto personalizado al carrito
  agregarAlCarrito(): void {
    console.log('🛒 Agregando producto personalizado al carrito:', {
      id: this.productoId,
      cantidad: this.cantidad,
      precio: this.precioProducto,
      personalizaciones: 'aquí irían las personalizaciones'
    });

    // Aquí implementarías la lógica para agregar el producto personalizado
    // this.pedidoService.agregarProductoPersonalizado(...)

    // Regresar al menú después de agregar
    this.volverAlMenu();
  }
}
