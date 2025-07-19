package com.kiosko.pinpad.service;

import com.kiosko.pinpad.config.PinpadConfig;
import com.kiosko.pinpad.dto.PagoRequest;
import com.kiosko.pinpad.dto.PagoResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// ✅ IMPORTAR CLASES DE DATAFAST
import DF.LAN;
import DF.LANConfig;
import DF.EnvioProcesoPago;
import DF.RespuestaProcesoPago;

@Service
public class PinpadService {
    
    private static final Logger logger = LoggerFactory.getLogger(PinpadService.class);
    
    @Autowired
    private PinpadConfig config;
    
    public PagoResponse procesarPago(PagoRequest request) {
        logger.info("🎯 Iniciando proceso de pago: Monto={}", request.getMontoTotal());
        
        try {
            // Configuración del PinPad con los datos del negocio y reglas
            LANConfig cfg = new LANConfig(
                config.getPinpadIp(),
                config.getPinpadPuerto(), 
                config.getTimeout(),
                config.getMid(),
                config.getTid(),
                config.getCid(),
                config.getVersion(),
                config.getSha()
            );
            
            // Se instancia un objeto LAN con las configuraciones anteriores
            LAN lan = new LAN(cfg);
            
            // Se instancia un objeto EnvioProcesoPago para preparar los datos de envío
            EnvioProcesoPago envio = new EnvioProcesoPago();
            
            // Asignar los campos básicos del envío
            envio.TipoTransaccion = request.getTipoTransaccion();
            envio.RedAdquirente = request.getRedAdquirente();
            envio.MontoTotal = request.getMontoTotal();
            envio.BaseImponible = request.getBaseImponible();
            envio.Base0 = request.getBase0();
            envio.IVA = request.getIva();
            
            logger.info("Enviando transacción al PinPad...");
            
            // Se ejecuta la transacción de pago
            RespuestaProcesoPago respuesta = lan.ProcesoPago(envio);
            
            // Primero se valida que la respuesta no sea nula
            if (respuesta == null) {
                logger.error("❌ Respuesta nula del PinPad");
                return new PagoResponse("ER", "PinPad no respondió");
            }
            
            // LOG DE RESPUESTA CRUDA
            logger.debug("📥 Respuesta cruda del PinPad: CodigoRespuesta={}", respuesta.CodigoRespuesta);
            
            // Validar que la respuesta tenga el formato esperado
            if (respuesta.CodigoRespuesta == null || respuesta.CodigoRespuesta.isEmpty()) {
                logger.error("❌ Código de respuesta vacío del PinPad");
                return new PagoResponse("ER", "Respuesta inválida del PinPad");
            }
            
            // Crear la respuesta de pago
            PagoResponse response = new PagoResponse();
            response.setCodigoRespuesta(respuesta.CodigoRespuesta);

            // Un pago es exitoso solo si tiene código '00' Y una autorización válida.
            boolean esExitoso = "00".equals(respuesta.CodigoRespuesta) && 
                                respuesta.Autorizacion != null && 
                                !respuesta.Autorizacion.trim().isEmpty();

            if (esExitoso) {
                logger.info("✅ Transacción AUTORIZADA. Código: {}, Autorización: {}", respuesta.CodigoRespuesta, respuesta.Autorizacion);
                response.setMensajeRespuesta("AUTORIZADO");
                response.setExitoso(true);
            } else {
                // Si el código es '00' pero no hay autorización, es un rechazo.
                String mensajeError = "00".equals(respuesta.CodigoRespuesta) 
                    ? "Transacción Rechazada (Sin autorización)" 
                    : getMensajePorCodigo(respuesta.CodigoRespuesta);
                
                logger.warn("Transacción RECHAZADA. Código: {}, Mensaje: {}", respuesta.CodigoRespuesta, mensajeError);
                
                // Sobrescribir el código a "RZ" (Rechazado) para que el frontend lo identifique claramente.
                response.setCodigoRespuesta("RZ"); 
                response.setMensajeRespuesta(mensajeError);
                response.setExitoso(false);
            }
            
            // Asignar el resto de los campos que puedan existir
            response.setAutorizacion(respuesta.Autorizacion);
            if (respuesta.Referencia != null) {
                response.setReferencia(respuesta.Referencia);
            }
            if (respuesta.Lote != null) {
                response.setLote(respuesta.Lote);
            }
            if (respuesta.NumeroTajeta != null) {
                response.setNumeroTarjeta(respuesta.NumeroTajeta);
            }
            if (respuesta.TarjetaHabiente != null) {
                response.setTarjetaHabiente(respuesta.TarjetaHabiente);
            }
            if (respuesta.ModoLectura != null) {
                response.setModoLectura(respuesta.ModoLectura);
            }
            
            logger.info("✅ Respuesta final enviada al frontend: Código={}, Mensaje={}, Exitoso={}", 
                       response.getCodigoRespuesta(), response.getMensajeRespuesta(), response.isExitoso());
            
            return response;
            
        } catch (Exception e) {
            logger.error("💥 Error en proceso de pago: {}", e.getMessage(), e);
            return new PagoResponse("ER", "Error de comunicación: " + e.getMessage());
        }
    }
    
    /**
     * ✅ MAPEAR CÓDIGO DE RESPUESTA A MENSAJE LEGIBLE
     */
    private String getMensajePorCodigo(String codigo) {
        if (codigo == null) return "Sin código";
        
        switch (codigo) {
            case "00": return "AUTORIZADO";
            case "01": return "ERROR EN TRAMA";
            case "02": return "ERROR CONEXIÓN PINPAD";
            case "20": return "ERROR DURANTE PROCESO";
            case "TO": return "TIMEOUT";
            case "ER": return "ERROR CONEXIÓN PINPAD";
            default: return "Código: " + codigo;
        }
    }
}