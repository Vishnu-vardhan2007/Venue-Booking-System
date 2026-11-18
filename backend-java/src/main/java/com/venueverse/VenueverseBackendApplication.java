package com.venueverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VenueverseBackendApplication {

    static {
        System.setProperty("jdk.tls.client.protocols", "TLSv1.2");
    }

    public static void main(String[] args) {
        SpringApplication.run(VenueverseBackendApplication.class, args);
    }
}
