package com.kiosko.pinpad.dto;

public class PagoResponse {
    
    // ✅ CAMPOS BÁSICOS DE RESPUESTA (según RespuestaProcesoPago)
    private String tipoMensaje = "PP";
    private String codigoRespuesta;
    private String mensajeRespuesta;
    private String codigoRespuestaAut;
    private String mensajeRespuestaAut;
    
    // ✅ DATOS DE LA TRANSACCIÓN
    private String referencia;
    private String lote;
    private String hora;
    private String fecha;
    private String autorizacion;
    private String tid;
    private String mid;
    
    // ✅ DATOS DEL BANCO/ADQUIRENTE
    private Integer redAdquirente;
    private String codigoAdquirente;
    private String nombreAdquirente;
    
    // ✅ DATOS DE LA TARJETA
    private String modoLectura; // 01=Manual, 02=Banda, 03=Chip, 04=Fallback manual, 05=Fallback banda
    private String tarjetaHabiente;
    private String numeroTarjeta; // Truncado: 123456XXXX123
    private String numeroTarjetaEncriptado; // SHA2
    private String fechaVencimiento;
    
    // ✅ DATOS EMV (para voucher)
    private String aplicacionEMV;
    private String aid;
    private String criptograma;
    private String pin;
    private String arqc;
    private String tvr;
    private String tsi;
    
    // ✅ OTROS DATOS
    private String interes;
    private String publicidad;
    private String montoFijo;
    private boolean exitoso;
    
    // Constructores
    public PagoResponse() {}
    
    // ✅ Constructor para respuesta exitosa
    public PagoResponse(String codigoRespuesta, String mensajeRespuesta, String autorizacion, String numeroTarjeta) {
        this.codigoRespuesta = codigoRespuesta;
        this.mensajeRespuesta = mensajeRespuesta;
        this.autorizacion = autorizacion;
        this.numeroTarjeta = numeroTarjeta;
        this.exitoso = "00".equals(codigoRespuesta);
    }
    
    // ✅ Constructor para error
    public PagoResponse(String codigoRespuesta, String mensajeRespuesta) {
        this.codigoRespuesta = codigoRespuesta;
        this.mensajeRespuesta = mensajeRespuesta;
        this.exitoso = false;
    }
    
    // Getters y Setters (todos los campos)
    public String getTipoMensaje() { return tipoMensaje; }
    public void setTipoMensaje(String tipoMensaje) { this.tipoMensaje = tipoMensaje; }
    
    public String getCodigoRespuesta() { return codigoRespuesta; }
    public void setCodigoRespuesta(String codigoRespuesta) { 
        this.codigoRespuesta = codigoRespuesta;
        this.exitoso = "00".equals(codigoRespuesta);
    }
    
    public String getMensajeRespuesta() { return mensajeRespuesta; }
    public void setMensajeRespuesta(String mensajeRespuesta) { this.mensajeRespuesta = mensajeRespuesta; }
    
    public String getCodigoRespuestaAut() { return codigoRespuestaAut; }
    public void setCodigoRespuestaAut(String codigoRespuestaAut) { this.codigoRespuestaAut = codigoRespuestaAut; }
    
    public String getMensajeRespuestaAut() { return mensajeRespuestaAut; }
    public void setMensajeRespuestaAut(String mensajeRespuestaAut) { this.mensajeRespuestaAut = mensajeRespuestaAut; }
    
    // ✅ Continúo con todos los getters/setters...
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    
    public String getLote() { return lote; }
    public void setLote(String lote) { this.lote = lote; }
    
    public String getAutorizacion() { return autorizacion; }
    public void setAutorizacion(String autorizacion) { this.autorizacion = autorizacion; }
    
    public String getNumeroTarjeta() { return numeroTarjeta; }
    public void setNumeroTarjeta(String numeroTarjeta) { this.numeroTarjeta = numeroTarjeta; }
    
    public String getTarjetaHabiente() { return tarjetaHabiente; }
    public void setTarjetaHabiente(String tarjetaHabiente) { this.tarjetaHabiente = tarjetaHabiente; }
    
    public String getModoLectura() { return modoLectura; }
    public void setModoLectura(String modoLectura) { this.modoLectura = modoLectura; }
    
    public boolean isExitoso() { return exitoso; }
    public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
    
    // ✅ Y todos los demás getters/setters...
}