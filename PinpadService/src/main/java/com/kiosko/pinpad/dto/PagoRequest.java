package com.kiosko.pinpad.dto;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

public class PagoRequest {
    
    // ✅ CAMPOS OBLIGATORIOS para ProcesoPago
    @NotNull
    @Pattern(regexp = "\\d{12}", message = "MontoTotal debe ser 12 dígitos")
    private String montoTotal;
    
    @Pattern(regexp = "\\d{12}", message = "Base0 debe ser 12 dígitos")
    private String base0 = "000000000000";
    
    @Pattern(regexp = "\\d{12}", message = "BaseImponible debe ser 12 dígitos")
    private String baseImponible = "000000000000";
    
    @Pattern(regexp = "\\d{12}", message = "IVA debe ser 12 dígitos")
    private String iva = "000000000000";
    
    // ✅ CAMPOS OPCIONALES
    private String servicio = "000000000000";
    private String propina = "000000000000";
    private String numeroFactura;
    
    // ✅ TIPOS DE TRANSACCIÓN (según documentación)
    private Integer tipoTransaccion = 1; // 1=Compra, 2=Diferido, 3=Anulación, 6=PayClub
    private Integer redAdquirente = 1;   // 1=Datafast, 2=Medianet, 3=Banco Austro
    private String codigoDiferido = "00"; // 00=Corriente
    
    // ✅ CAMPOS PARA ANULACIONES
    private String referencia;
    private String autorizacion;
    
    // ✅ CAMPOS PARA OTT (PayClub)
    private String ott;
    private String ottProveedor = "01"; // 01=Diners PayClub, 02=Pacífico BdP
    
    // Constructores
    public PagoRequest() {}
    
    // ✅ Constructor para compra normal
    public PagoRequest(String montoTotal, String baseImponible, String iva) {
        this.montoTotal = montoTotal;
        this.baseImponible = baseImponible;
        this.iva = iva;
    }
    
    // ✅ Constructor para anulación
    public PagoRequest(String referencia, String autorizacion, Integer redAdquirente) {
        this.tipoTransaccion = 3; // Anulación
        this.referencia = referencia;
        this.autorizacion = autorizacion;
        this.redAdquirente = redAdquirente;
    }
    
    // Getters y Setters
    public String getMontoTotal() { return montoTotal; }
    public void setMontoTotal(String montoTotal) { this.montoTotal = montoTotal; }
    
    public String getBase0() { return base0; }
    public void setBase0(String base0) { this.base0 = base0; }
    
    public String getBaseImponible() { return baseImponible; }
    public void setBaseImponible(String baseImponible) { this.baseImponible = baseImponible; }
    
    public String getIva() { return iva; }
    public void setIva(String iva) { this.iva = iva; }
    
    public String getServicio() { return servicio; }
    public void setServicio(String servicio) { this.servicio = servicio; }
    
    public String getPropina() { return propina; }
    public void setPropina(String propina) { this.propina = propina; }
    
    public String getNumeroFactura() { return numeroFactura; }
    public void setNumeroFactura(String numeroFactura) { this.numeroFactura = numeroFactura; }
    
    public Integer getTipoTransaccion() { return tipoTransaccion; }
    public void setTipoTransaccion(Integer tipoTransaccion) { this.tipoTransaccion = tipoTransaccion; }
    
    public Integer getRedAdquirente() { return redAdquirente; }
    public void setRedAdquirente(Integer redAdquirente) { this.redAdquirente = redAdquirente; }
    
    public String getCodigoDiferido() { return codigoDiferido; }
    public void setCodigoDiferido(String codigoDiferido) { this.codigoDiferido = codigoDiferido; }
    
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    
    public String getAutorizacion() { return autorizacion; }
    public void setAutorizacion(String autorizacion) { this.autorizacion = autorizacion; }
    
    public String getOtt() { return ott; }
    public void setOtt(String ott) { this.ott = ott; }
    
    public String getOttProveedor() { return ottProveedor; }
    public void setOttProveedor(String ottProveedor) { this.ottProveedor = ottProveedor; }
}