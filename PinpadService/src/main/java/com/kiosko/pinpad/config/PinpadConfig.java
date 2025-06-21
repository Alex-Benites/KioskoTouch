package com.kiosko.pinpad.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PinpadConfig {
    
    // ✅ CONFIGURACIÓN DEL PINPAD (según documentación Datafast)
    @Value("${pinpad.ip:192.168.1.100}")
    private String pinpadIp;
    
    @Value("${pinpad.puerto:9999}")
    private int pinpadPuerto;
    
    @Value("${pinpad.timeout:90000}")
    private int timeout;
    
    // ✅ DATOS DEL COMERCIO (asignados por Datafast)
    @Value("${datafast.mid:123456789012345}")
    private String mid;
    
    @Value("${datafast.tid:12345678}")
    private String tid;
    
    @Value("${datafast.cid:CAJA001}")
    private String cid;
    
    // ✅ CONFIGURACIÓN DATAFAST (según documentación)
    @Value("${datafast.version:2}")
    private int version; // 2 = FastTrack
    
    @Value("${datafast.sha:2}")
    private int sha; // 2 = SHA2
    
    // Getters
    public String getPinpadIp() { return pinpadIp; }
    public int getPinpadPuerto() { return pinpadPuerto; }
    public int getTimeout() { return timeout; }
    public String getMid() { return mid; }
    public String getTid() { return tid; }
    public String getCid() { return cid; }
    public int getVersion() { return version; }
    public int getSha() { return sha; }
    
    // ✅ Método para obtener configuración completa como String (para logs)
    public String getConfigInfo() {
        return String.format("PinPad Config: IP=%s:%d, MID=%s, TID=%s, CID=%s", 
                           pinpadIp, pinpadPuerto, mid, tid, cid);
    }
}