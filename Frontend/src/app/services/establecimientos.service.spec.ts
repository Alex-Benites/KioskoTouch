import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EstablecimientosService } from './establecimientos.service';
import { Establecimiento } from '../models/establecimiento.model'; // <--- Corrige aquí
import { environment } from '../../environments/environment';

describe('EstablecimientosService', () => {
  let service: EstablecimientosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EstablecimientosService]
    });
    service = TestBed.inject(EstablecimientosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería hacer POST para crear un establecimiento', () => {
    const mockEstablecimiento: Establecimiento = {
      nombre: 'Test',
      tipo_establecimiento: 'Restaurante',
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Av. Principal',
      telefono: '0999999999',
      correo: 'test@correo.com',
      responsable_id: 1,
      estado_id: 1
    };

    service.crearEstablecimiento(mockEstablecimiento).subscribe(resp => {
      expect(resp.success).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/establecimientos/crear/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockEstablecimiento);

    req.flush({ success: true });
  });
});