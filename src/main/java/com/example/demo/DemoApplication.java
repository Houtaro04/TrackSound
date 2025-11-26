package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;


@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        System.out.println("=== BAT DAU CHAY APP CUA VIET ANH ===");
        SpringApplication.run(DemoApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void printLinks() {
        System.out.println("==========================================");
        System.out.println("Application started! Test links in browser:");
        System.out.println("Homepage:   http://localhost:8080/api/");
        System.out.println("Create doc: http://localhost:8080/api/firestore/create?docId=test1&message=Hello");
        System.out.println("Read doc:   http://localhost:8080/api/firestore/read?docId=test1");
        System.out.println("Delete doc: http://localhost:8080/api/firestore/delete?docId=test1");
        System.out.println("==========================================");
    }
}