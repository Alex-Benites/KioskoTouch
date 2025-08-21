package com.kiosko.pinpad.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PinpadConfig {
    
    @Value("${pinpad.ip:192.168.1.100}")
    private String pinpadIp;
    
    @Value("${pinpad.puerto:9999}")
    private int pinpadPuerto;
    
    @Value("${pinpad.timeout:90000}")
    private int timeout;
    
    @Value("${datafast.mid:123456789012345}")
    private String mid;
    
    @Value("${datafast.tid:12345678}")
    private String tid;
    
    @Value("${datafast.cid:CAJA001}")
    private String cid;
    
    @Value("${datafast.version:2}")
    @Value("${datafast.sha:2}")
    
    public String getPinpadIp() { return pinpadIp; }
    public int getPinpadPuerto() { return pinpadPuerto; }
    public int getTimeout() { return timeout; }
    public String getMid() { return mid; }
    public String getTid() { return tid; }
    public String getCid() { return cid; }
    public int getVersion() { return version; }
    public int getSha() { return sha; }
    
    public String getConfigInfo() {
        return String.format("PinPad Config: IP=%s:%d, MID=%s, TID=%s, CID=%s", 
                           pinpadIp, pinpadPuerto, mid, tid, cid);
    }
}