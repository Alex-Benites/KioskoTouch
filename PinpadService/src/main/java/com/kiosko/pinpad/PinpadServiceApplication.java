package com.kiosko.pinpad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PinpadServiceApplication {

    public static void main(String[] args) {
        System.out.println("🚀 Iniciando Kiosko PinPad Service...");
        System.out.println("📡 Conectando con librería Datafast...");
        SpringApplication.run(PinpadServiceApplication.class, args);
        System.out.println("✅ PinPad Service iniciado correctamente en puerto 8080");
        System.out.println("🎯 Endpoints disponibles:");
        System.out.println("   POST /api/pinpad/pagar - Procesar pago");
        System.out.println("   POST /api/pinpad/consultar-tarjeta - Leer tarjeta");
        System.out.println("   POST /api/pinpad/control - Proceso de control");
    }
}