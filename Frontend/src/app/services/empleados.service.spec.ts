import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmpleadosService, EmpleadoDropdown, EmpleadosResponse } from './empleados.service';
import { environment } from '../../environments/environment';

describe('EmpleadosService', () => {
  let service: EmpleadosService;
  let httpMock: HttpTestingController;

  const mockEmpleados: EmpleadoDropdown[] = [
    {
      id: 1,
      user_id: 10,
      nombres: 'María',
      apellidos: 'García',
      nombre_completo: 'María García',
      cargo: 'Gerente',
      cedula: '0123456789',
      telefono: '0999999999',
      email: 'maria.garcia@empresa.com'
    },
    {
      id: 2,
      user_id: 11,
      nombres: 'Carlos',
      apellidos: 'López',
      nombre_completo: 'Carlos López',
      cargo: 'Administrador',
      cedula: '0987654321',
      telefono: '0988888888',
      email: 'carlos.lopez@empresa.com'
    }
  ];

  const mockResponse: EmpleadosResponse = {
    empleados: mockEmpleados,
    total: 2
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmpleadosService]
    });
    service = TestBed.inject(EmpleadosService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage para token de autenticación
    spyOn(localStorage, 'getItem').and.returnValue('fake-jwt-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('access_token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEmpleadosParaDropdown', () => {
    it('should retrieve empleados from API via GET', () => {
      // Arrange & Act
      service.getEmpleadosParaDropdown().subscribe(response => {
        // Assert
        expect(response).toEqual(mockResponse);
        expect(response.empleados.length).toBe(2);
        expect(response.total).toBe(2);
        expect(response.empleados[0].nombre_completo).toBe('María García');
        expect(response.empleados[1].cargo).toBe('Administrador');
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/empleados/dropdown/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      // Respond with mock data
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      // Arrange
      const errorMessage = 'Error al cargar empleados';

      // Act
      service.getEmpleadosParaDropdown().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
        }
      });

      // Assert HTTP request with error
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/empleados/dropdown/`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle unauthorized error (401)', () => {
      // Act
      service.getEmpleadosParaDropdown().subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(401);
        }
      });

      // Assert HTTP request with unauthorized error
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/empleados/dropdown/`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getEmpleadoPorId', () => {
    it('should retrieve single empleado by ID', () => {
      // Arrange
      const empleadoId = 1;
      const mockEmpleado = mockEmpleados[0];

      // Act
      service.getEmpleadoPorId(empleadoId).subscribe(empleado => {
        // Assert
        expect(empleado).toEqual(mockEmpleado);
        expect(empleado.id).toBe(1);
        expect(empleado.nombre_completo).toBe('María García');
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/empleados/${empleadoId}/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');

      // Respond with mock data
      req.flush(mockEmpleado);
    });
  });

  describe('getHeaders', () => {
    it('should create headers with authorization token', () => {
      // Arrange - localStorage.getItem ya está mockeado en beforeEach

      // Act
      const headers = (service as any).getHeaders(); // Acceso privado para testing

      // Assert
      expect(headers.get('Authorization')).toBe('Bearer fake-jwt-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle missing token', () => {
      // Arrange
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      // Act
      const headers = (service as any).getHeaders();

      // Assert
      expect(headers.get('Authorization')).toBe('Bearer null');
    });
  });
});