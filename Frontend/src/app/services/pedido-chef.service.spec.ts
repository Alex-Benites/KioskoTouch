import { TestBed } from '@angular/core/testing';

import { PedidoChefService } from './pedido-chef.service';

describe('PedidoChefService', () => {
  let service: PedidoChefService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidoChefService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
