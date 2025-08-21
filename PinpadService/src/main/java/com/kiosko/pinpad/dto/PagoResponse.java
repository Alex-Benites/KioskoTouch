package com.kiosko.pinpad.dto;

public class PagoResponse {
    
    private String tipoMensaje = "PP";
    private String codigoRespuesta;
    private String mensajeRespuesta;
    private String codigoRespuestaAut;
    private String mensajeRespuestaAut;
    
    private String referencia;
    private String lote;
    private String hora;
    private String fecha;
    private String autorizacion;
    private String tid;
    private String mid;
    
    private Integer redAdquirente;
    private String codigoAdquirente;
    private String nombreAdquirente;
    
    private String modoLectura; 
    private String tarjetaHabiente;
    private String numeroTarjeta; 
    private String numeroTarjetaEncriptado; 
    private String fechaVencimiento;
    
    private String aplicacionEMV;
    private String aid;
    private String criptograma;
    private String pin;
    private String arqc;
    private String tvr;
    private String tsi;
    
    private String interes;
    private String publicidad;
    private String montoFijo;
    private boolean exitoso;
    
    public PagoResponse() {}
    
    public PagoResponse(String codigoRespuesta, String mensajeRespuesta, String autorizacion, String numeroTarjeta) {
        this.codigoRespuesta = codigoRespuesta;
        this.mensajeRespuesta = mensajeRespuesta;
        this.autorizacion = autorizacion;
        this.numeroTarjeta = numeroTarjeta;
        this.exitoso = "00".equals(codigoRespuesta);
    }
    
    public PagoResponse(String codigoRespuesta, String mensajeRespuesta) {
        this.codigoRespuesta = codigoRespuesta;
        this.mensajeRespuesta = mensajeRespuesta;
        this.exitoso = false;
    }
    
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
    
    
    public String getHora() { return hora; }
    public void setHora(String hora) { this.hora = hora; }
    
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    
    public String getTid() { return tid; }
    public void setTid(String tid) { this.tid = tid; }
    
    public String getMid() { return mid; }
    public void setMid(String mid) { this.mid = mid; }
    
    public Integer getRedAdquirente() { return redAdquirente; }
    public void setRedAdquirente(Integer redAdquirente) { this.redAdquirente = redAdquirente; }
    
    public String getCodigoAdquirente() { return codigoAdquirente; }
    public void setCodigoAdquirente(String codigoAdquirente) { this.codigoAdquirente = codigoAdquirente; }
    
    public String getNombreAdquirente() { return nombreAdquirente; }
    public void setNombreAdquirente(String nombreAdquirente) { this.nombreAdquirente = nombreAdquirente; }
    
    public String getNumeroTarjetaEncriptado() { return numeroTarjetaEncriptado; }
    public void setNumeroTarjetaEncriptado(String numeroTarjetaEncriptado) { this.numeroTarjetaEncriptado = numeroTarjetaEncriptado; }
    
    public String getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(String fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    
    public String getAplicacionEMV() { return aplicacionEMV; }
    public void setAplicacionEMV(String aplicacionEMV) { this.aplicacionEMV = aplicacionEMV; }
    
    public String getAid() { return aid; }
    public void setAid(String aid) { this.aid = aid; }
    
    public String getCriptograma() { return criptograma; }
    public void setCriptograma(String criptograma) { this.criptograma = criptograma; }
    
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
    
    public String getArqc() { return arqc; }
    public void setArqc(String arqc) { this.arqc = arqc; }
    
    public String getTvr() { return tvr; }
    public void setTvr(String tvr) { this.tvr = tvr; }
    
    public String getTsi() { return tsi; }
    public void setTsi(String tsi) { this.tsi = tsi; }
    
    public String getInteres() { return interes; }
    public void setInteres(String interes) { this.interes = interes; }
    
    public String getPublicidad() { return publicidad; }
    public void setPublicidad(String publicidad) { this.publicidad = publicidad; }
    
    public String getMontoFijo() { return montoFijo; }
    public void setMontoFijo(String montoFijo) { this.montoFijo = montoFijo; }
}