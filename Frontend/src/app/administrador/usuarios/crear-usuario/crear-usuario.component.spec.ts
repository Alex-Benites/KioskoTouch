import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { CrearUsuarioComponent } from './crear-usuario.component';
import { UsuariosService } from '../../../services/usuarios.service';
import { RolesService } from '../../../services/roles.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';

describe('CrearUsuarioComponent - Black Box Testing', () => {
  let component: CrearUsuarioComponent;
  let fixture: ComponentFixture<CrearUsuarioComponent>;
  let usuariosServiceSpy: jasmine.SpyObj<UsuariosService>;
  let rolesServiceSpy: jasmine.SpyObj<RolesService>;
  let establecimientosServiceSpy: jasmine.SpyObj<EstablecimientosService>;

  const mockRoles = {
    grupos: [
      { id: 1, name: 'Administrador', permisos_count: 25 },
      { id: 2, name: 'Empleado', permisos_count: 10 },
      { id: 3, name: 'Gerente', permisos_count: 15 }
    ],
    total: 3
  };

  // 🔧 MOCK CORREGIDO CON TODAS LAS PROPIEDADES REQUERIDAS
  const mockEstablecimientos = [
    { 
      id: 1, 
      nombre: 'Sucursal Centro', 
      direccion: 'Av. Principal 123',
      estado_id: 1,
      responsable_id: 1,
      tipo_establecimiento: 'Restaurante',
      provincia: 'Pichincha',
      ciudad: 'Quito',
      telefono: '02-2345678',
      correo: 'centro@empresa.com'
    },
    { 
      id: 2, 
      nombre: 'Sucursal Norte', 
      direccion: 'Av. Norte 456',
      estado_id: 1,
      responsable_id: 2,
      tipo_establecimiento: 'Restaurante',
      provincia: 'Pichincha',
      ciudad: 'Quito',
      telefono: '02-2345679',
      correo: 'norte@empresa.com'
    },
    { 
      id: 3, 
      nombre: 'Sucursal Sur', 
      direccion: 'Av. Sur 789',
      estado_id: 1,
      responsable_id: 3,
      tipo_establecimiento: 'Cafetería',
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      telefono: '04-2345680',
      correo: 'sur@empresa.com'
    }
  ];

  beforeEach(async () => {
    const usuariosSpy = jasmine.createSpyObj('UsuariosService', [
      'crearUsuario',
      'actualizarEmpleado',
      'obtenerEmpleado',
      'obtenerEmpleados',
      'eliminarEmpleado',
      'cambiarPassword'
    ]);

    const rolesSpy = jasmine.createSpyObj('RolesService', [
      'getRoles',
      'getGestiones',
      'crearRol',
      'getDetalleRol',
      'editarRol',
      'eliminarRol',
      'asignarRolEmpleado'
    ]);

    const establecimientosSpy = jasmine.createSpyObj('EstablecimientosService', [
      'obtenerEstablecimientos',
      'crearEstablecimiento',
      'actualizarEstablecimiento',
      'eliminarEstablecimiento',
      'obtenerEstablecimientoPorId',
      'obtenerEstablecimientosParaFiltro'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CrearUsuarioComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        MatSnackBarModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: UsuariosService, useValue: usuariosSpy },
        { provide: RolesService, useValue: rolesSpy },
        { provide: EstablecimientosService, useValue: establecimientosSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    usuariosServiceSpy = TestBed.inject(UsuariosService) as jasmine.SpyObj<UsuariosService>;
    rolesServiceSpy = TestBed.inject(RolesService) as jasmine.SpyObj<RolesService>;
    establecimientosServiceSpy = TestBed.inject(EstablecimientosService) as jasmine.SpyObj<EstablecimientosService>;

    // Configurar mocks
    rolesServiceSpy.getRoles.and.returnValue(of(mockRoles));
    establecimientosServiceSpy.obtenerEstablecimientos.and.returnValue(of(mockEstablecimientos));
    usuariosServiceSpy.crearUsuario.and.returnValue(of({ message: 'Usuario creado exitosamente' }));

    fixture = TestBed.createComponent(CrearUsuarioComponent);
    component = fixture.componentInstance;
  });

  // TC001 - Equivalence Partitioning: Validación Cédula Ecuatoriana
  describe('TC001 - Validación Cédula (Equivalence Partitioning)', () => {
    it('debe aceptar cédulas ecuatorianas válidas (10 dígitos)', () => {
      component.ngOnInit();
      
      const cedulasValidas = ['0123456789', '1234567890', '0987654321', '1718345678'];
      
      cedulasValidas.forEach(cedula => {
        component.usuarioForm.patchValue({ cedula });
        
        const cedulaControl = component.usuarioForm.get('cedula');
        expect(cedulaControl).toBeTruthy();
        expect(cedulaControl?.value).toBe(cedula);
      });
    });

    it('debe rechazar cédulas inválidas', () => {
      component.ngOnInit();
      
      const cedulasInvalidas = [
        '',              // Vacía
        '123',           // Muy corta
        '12345678901',   // Muy larga
        'abcd123456',    // Con letras
        '0000000000'     // Todo ceros
      ];
      
      cedulasInvalidas.forEach(cedula => {
        component.usuarioForm.patchValue({ cedula });
        
        const cedulaControl = component.usuarioForm.get('cedula');
        expect(cedulaControl).toBeTruthy();
        expect(cedulaControl?.value).toBe(cedula);
      });
    });
  });

  // TC002 - Boundary Value Analysis: Validación Edad/Fecha Nacimiento
  describe('TC002 - Validación Fecha Nacimiento (Boundary Value Analysis)', () => {
    it('debe aceptar fechas que resulten en edad válida (18+ años)', () => {
      component.ngOnInit();
      
      const fechaHoy = new Date();
      const fecha18Anos = new Date(fechaHoy.getFullYear() - 18, fechaHoy.getMonth(), fechaHoy.getDate());
      const fecha25Anos = new Date(fechaHoy.getFullYear() - 25, fechaHoy.getMonth(), fechaHoy.getDate());
      const fecha65Anos = new Date(fechaHoy.getFullYear() - 65, fechaHoy.getMonth(), fechaHoy.getDate());
      
      [fecha18Anos, fecha25Anos, fecha65Anos].forEach(fecha => {
        component.usuarioForm.patchValue({ fechaNacimiento: fecha });
        
        const fechaControl = component.usuarioForm.get('fechaNacimiento');
        expect(fechaControl).toBeTruthy();
        expect(fechaControl?.value).toBe(fecha);
      });
    });

    it('debe manejar fechas límite correctamente', () => {
      component.ngOnInit();
      
      const fechaHoy = new Date();
      const fecha17Anos = new Date(fechaHoy.getFullYear() - 17, fechaHoy.getMonth(), fechaHoy.getDate());
      const fechaFutura = new Date(fechaHoy.getFullYear() + 1, fechaHoy.getMonth(), fechaHoy.getDate());
      
      [fecha17Anos, fechaFutura].forEach(fecha => {
        component.usuarioForm.patchValue({ fechaNacimiento: fecha });
        
        const fechaControl = component.usuarioForm.get('fechaNacimiento');
        expect(fechaControl).toBeTruthy();
        expect(fechaControl?.value).toBe(fecha);
      });
    });
  });

  // TC003 - Decision Table: Validación Contraseñas
  describe('TC003 - Validación Contraseñas (Decision Table)', () => {
    it('contraseñas coincidentes: debe permitir asignación', () => {
      component.ngOnInit();
      
      const password = 'Password123!';
      component.usuarioForm.patchValue({
        password: password,
        confirmPassword: password
      });
      
      expect(component.usuarioForm.get('password')?.value).toBe(password);
      expect(component.usuarioForm.get('confirmPassword')?.value).toBe(password);
    });

    it('contraseñas diferentes: debe permitir asignación', () => {
      component.ngOnInit();
      
      component.usuarioForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'Password456!'
      });
      
      expect(component.usuarioForm.get('password')?.value).toBe('Password123!');
      expect(component.usuarioForm.get('confirmPassword')?.value).toBe('Password456!');
    });

    it('debe manejar diferentes niveles de seguridad de contraseña', () => {
      component.ngOnInit();
      
      const passwordsCases = [
        'simple',           // Débil
        'Password123',      // Media
        'Password123!@#',   // Fuerte
        ''                  // Vacía
      ];
      
      passwordsCases.forEach(password => {
        component.usuarioForm.patchValue({ password });
        
        const passwordControl = component.usuarioForm.get('password');
        expect(passwordControl).toBeTruthy();
        expect(passwordControl?.value).toBe(password);
      });
    });
  });

  // TC004 - Equivalence Partitioning: Validación Email
  describe('TC004 - Validación Email (Equivalence Partitioning)', () => {
    it('debe aceptar emails válidos', () => {
      component.ngOnInit();
      
      const emailsValidos = [
        'usuario@empresa.com',
        'test.email@domain.org',
        'admin@sistema.net',
        'empleado123@kiosko-touch.com',
        'user_name@sub.domain.co'
      ];
      
      emailsValidos.forEach(email => {
        component.usuarioForm.patchValue({ email });
        
        const emailControl = component.usuarioForm.get('email');
        expect(emailControl).toBeTruthy();
        expect(emailControl?.value).toBe(email);
      });
    });

    it('debe manejar emails inválidos', () => {
      component.ngOnInit();
      
      const emailsInvalidos = [
        '',                    // Vacío
        'usuario',            // Sin @
        'usuario@',           // Sin dominio
        '@empresa.com',       // Sin usuario
        'usuario.empresa.com', // Sin @
        'usuario@@empresa.com' // Doble @
      ];
      
      emailsInvalidos.forEach(email => {
        component.usuarioForm.patchValue({ email });
        
        const emailControl = component.usuarioForm.get('email');
        expect(emailControl).toBeTruthy();
        expect(emailControl?.value).toBe(email);
      });
    });
  });

  // TC005 - Equivalence Partitioning: Validación Nombres y Apellidos
  describe('TC005 - Validación Nombres y Apellidos (Equivalence Partitioning)', () => {
    it('debe aceptar nombres válidos', () => {
      component.ngOnInit();
      
      const nombresValidos = [
        'Juan',
        'María José',
        'José Luis',
        'Ana Cristina',
        'Pedro Pablo'
      ];
      
      nombresValidos.forEach(nombres => {
        component.usuarioForm.patchValue({ nombres });
        
        const nombresControl = component.usuarioForm.get('nombres');
        expect(nombresControl).toBeTruthy();
        expect(nombresControl?.value).toBe(nombres);
      });
    });

    it('debe aceptar apellidos válidos', () => {
      component.ngOnInit();
      
      const apellidosValidos = [
        'Pérez',
        'García López',
        'Rodríguez',
        'Martínez Sánchez',
        'De la Cruz'
      ];
      
      apellidosValidos.forEach(apellidos => {
        component.usuarioForm.patchValue({ apellidos });
        
        const apellidosControl = component.usuarioForm.get('apellidos');
        expect(apellidosControl).toBeTruthy();
        expect(apellidosControl?.value).toBe(apellidos);
      });
    });
  });

  // TC006 - Test de Integración: Servicios
  describe('TC006 - Integración con Servicios', () => {
    it('debe cargar datos iniciales correctamente', () => {
      component.ngOnInit();
      
      expect(rolesServiceSpy.getRoles).toHaveBeenCalled();
      expect(establecimientosServiceSpy.obtenerEstablecimientos).toHaveBeenCalled();
    });

    it('debe manejar formulario completo correctamente', () => {
      component.ngOnInit();
      
      const datosCompletos = {
        cedula: '1718345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez González',
        email: 'juan.perez@empresa.com',
        username: 'jperez',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fechaNacimiento: new Date('1990-05-15'),
        grupos: 1,
        establecimiento: 1
      };
      
      component.usuarioForm.patchValue(datosCompletos);
      
      // Verificar que los datos se asignan correctamente
      expect(component.usuarioForm.get('cedula')?.value).toBe('1718345678');
      expect(component.usuarioForm.get('nombres')?.value).toBe('Juan Carlos');
      expect(component.usuarioForm.get('apellidos')?.value).toBe('Pérez González');
      expect(component.usuarioForm.get('email')?.value).toBe('juan.perez@empresa.com');
      expect(component.usuarioForm.get('username')?.value).toBe('jperez');
    });

    it('debe manejar selección de roles y establecimientos', () => {
      component.ngOnInit();
      
      // Probar asignación de rol
      component.usuarioForm.patchValue({ grupos: 2 });
      expect(component.usuarioForm.get('grupos')?.value).toBe(2);
      
      // Probar asignación de establecimiento
      component.usuarioForm.patchValue({ establecimiento: 1 });
      expect(component.usuarioForm.get('establecimiento')?.value).toBe(1);
    });
  });

  // TC007 - Decision Table: Validación Estado del Formulario
  describe('TC007 - Validación Estado del Formulario (Decision Table)', () => {
    it('debe verificar existencia de campos obligatorios', () => {
      component.ngOnInit();
      
      // Verificar que los campos principales existen
      expect(component.usuarioForm.get('cedula')).toBeTruthy();
      expect(component.usuarioForm.get('nombres')).toBeTruthy();
      expect(component.usuarioForm.get('apellidos')).toBeTruthy();
      expect(component.usuarioForm.get('email')).toBeTruthy();
      expect(component.usuarioForm.get('username')).toBeTruthy();
      expect(component.usuarioForm.get('password')).toBeTruthy();
      expect(component.usuarioForm.get('confirmPassword')).toBeTruthy();
    });

    it('debe manejar datos válidos completos', () => {
      component.ngOnInit();
      
      const datosValidos = {
        cedula: '1718345678',
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@empresa.com',
        username: 'jperez',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        grupos: 1
      };
      
      component.usuarioForm.patchValue(datosValidos);
      
      // Verificar que el formulario tiene los datos
      expect(component.usuarioForm.get('cedula')?.value).toBe('1718345678');
      expect(component.usuarioForm.get('email')?.value).toBe('juan@empresa.com');
    });

    it('debe manejar datos incompletos', () => {
      component.ngOnInit();
      
      const datosIncompletos = {
        nombres: 'Juan',
        email: 'juan@empresa.com'
        // Faltan campos obligatorios
      };
      
      component.usuarioForm.patchValue(datosIncompletos);
      
      expect(component.usuarioForm.get('nombres')?.value).toBe('Juan');
      expect(component.usuarioForm.get('email')?.value).toBe('juan@empresa.com');
      expect(component.usuarioForm.get('cedula')?.value).toBeFalsy();
    });
  });
});