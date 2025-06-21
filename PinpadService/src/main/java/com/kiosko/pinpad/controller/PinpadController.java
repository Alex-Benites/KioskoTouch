package com.kiosko.pinpad.controller;

import com.kiosko.pinpad.dto.PagoRequest;
import com.kiosko.pinpad.dto.PagoResponse;
import com.kiosko.pinpad.service.PinpadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/pinpad")
@CrossOrigin(origins = "*")
public class PinpadController {
    
    private static final Logger logger = LoggerFactory.getLogger(PinpadController.class);
    
    @Autowired
    private PinpadService pinpadService;
    
    /**
     * ✅ ENDPOINT PRINCIPAL: PROCESAR PAGO
     * POST /api/pinpad/pagar
     */
    @PostMapping("/pagar")
    public ResponseEntity<PagoResponse> procesarPago(@Valid @RequestBody PagoRequest request) {
        logger.info("🎯 API /pagar - Solicitud de pago: Monto={}", request.getMontoTotal());
        
        try {
            // ✅ Validar monto
            if (request.getMontoTotal() == null || request.getMontoTotal().trim().isEmpty()) {
                logger.warn("❌ Monto total requerido");
                PagoResponse errorResponse = new PagoResponse("01", "Monto total es requerido");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // ✅ Procesar pago
            PagoResponse response = pinpadService.procesarPago(request);
            
            // ✅ Determinar código de respuesta HTTP
            if (response.isExitoso()) {
                logger.info("✅ Pago procesado exitosamente: {}", response.getAutorizacion());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ Pago rechazado: {}", response.getMensajeRespuesta());
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
            }
            
        } catch (Exception e) {
            logger.error("💥 Error en API /pagar: {}", e.getMessage(), e);
            PagoResponse errorResponse = new PagoResponse("ER", "Error interno del servidor");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * ✅ ENDPOINT: CONSULTAR TARJETA (sin procesamiento)
     * POST /api/pinpad/consultar-tarjeta
     */
    @PostMapping("/consultar-tarjeta")
    public ResponseEntity<PagoResponse> consultarTarjeta() {
        logger.info("🔍 API /consultar-tarjeta - Iniciando consulta");
        
        try {
            // Por ahora, simulamos la consulta
            PagoResponse response = new PagoResponse("00", "Tarjeta leída correctamente");
            response.setNumeroTarjeta("****-****-****-1234");
            
            logger.info("✅ Tarjeta consultada: {}", response.getNumeroTarjeta());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("💥 Error en API /consultar-tarjeta: {}", e.getMessage(), e);
            PagoResponse errorResponse = new PagoResponse("ER", "Error consultando tarjeta");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * ✅ ENDPOINT: PROCESO DE CONTROL
     * POST /api/pinpad/control
     */
    @PostMapping("/control")
    public ResponseEntity<PagoResponse> procesoControl() {
        logger.info("⚙️ API /control - Iniciando proceso de control");
        
        try {
            // Por ahora, simulamos el proceso de control
            PagoResponse response = new PagoResponse("00", "Proceso de control completado");
            
            logger.info("✅ Proceso de control exitoso");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("💥 Error en API /control: {}", e.getMessage(), e);
            PagoResponse errorResponse = new PagoResponse("ER", "Error en proceso de control");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * ✅ ENDPOINT: HEALTH CHECK
     * GET /api/pinpad/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        logger.debug("💓 Health check solicitado");
        return ResponseEntity.ok("🚀 PinPad Service está funcionando correctamente");
    }
    
    /**
     * ✅ ENDPOINT: ANULAR TRANSACCIÓN
     * POST /api/pinpad/anular
     */
    @PostMapping("/anular")
    public ResponseEntity<PagoResponse> anularTransaccion(@Valid @RequestBody PagoRequest request) {
        logger.info("🔄 API /anular - Anulando transacción: Ref={}", request.getReferencia());
        
        try {
            // ✅ Validar datos para anulación
            if (request.getReferencia() == null || request.getAutorizacion() == null) {
                logger.warn("❌ Referencia y autorización requeridas para anulación");
                PagoResponse errorResponse = new PagoResponse("01", "Referencia y autorización requeridas");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // ✅ Configurar como anulación
            request.setTipoTransaccion(3); // 3 = Anulación
            
            // ✅ Procesar anulación
            PagoResponse response = pinpadService.procesarPago(request);
            
            if (response.isExitoso()) {
                logger.info("✅ Anulación procesada exitosamente");
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ Anulación rechazada: {}", response.getMensajeRespuesta());
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
            }
            
        } catch (Exception e) {
            logger.error("💥 Error en API /anular: {}", e.getMessage(), e);
            PagoResponse errorResponse = new PagoResponse("ER", "Error anulando transacción");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}