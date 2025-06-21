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
    
    /**
     * ✅ PROCESAR PAGO CON PINPAD - VERSIÓN SIMPLIFICADA
     */
    public PagoResponse procesarPago(PagoRequest request) {
        logger.info("🎯 Iniciando proceso de pago: Monto={}", request.getMontoTotal());
        
        try {
            // ✅ 1. CREAR CONFIGURACIÓN DATAFAST
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
            
            // ✅ 2. CREAR INSTANCIA LAN
            LAN lan = new LAN(cfg);
            
            // ✅ 3. PREPARAR DATOS DE ENVÍO
            EnvioProcesoPago envio = new EnvioProcesoPago();
            
            // ✅ Asignar campos básicos
            envio.TipoTransaccion = request.getTipoTransaccion();
            envio.RedAdquirente = request.getRedAdquirente();
            envio.MontoTotal = request.getMontoTotal();
            envio.BaseImponible = request.getBaseImponible();
            envio.Base0 = request.getBase0();
            envio.IVA = request.getIva();
            
            logger.info("📡 Enviando transacción al PinPad...");
            
            // ✅ 4. EJECUTAR TRANSACCIÓN
            RespuestaProcesoPago respuesta = lan.ProcesoPago(envio);
            
            // ✅ 5. CREAR RESPUESTA BÁSICA (solo campos que SÍ existen)
            PagoResponse response = new PagoResponse();
            
            // ✅ Campos básicos que SABEMOS que existen
            response.setCodigoRespuesta(respuesta.CodigoRespuesta);
            response.setMensajeRespuesta(getMensajePorCodigo(respuesta.CodigoRespuesta));
            
            // ✅ Campos que probablemente existen en tu PagoResponse
            if (respuesta.Autorizacion != null) {
                response.setAutorizacion(respuesta.Autorizacion);
            }
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
            
            logger.info("✅ Respuesta del PinPad: Código={}, Autorización={}", 
                       response.getCodigoRespuesta(), response.getAutorizacion());
            
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