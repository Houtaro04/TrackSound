package com.example.demo.controller;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/firestore")
public class FirestoreController {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // Create or update document
    @GetMapping("/create")
    public Map<String, Object> createDocument(@RequestParam String docId, @RequestParam String message) throws ExecutionException, InterruptedException {
        Firestore db = getDb();
        Map<String, Object> data = new HashMap<>();
        data.put("message", message);
        db.collection("testCollection").document(docId).set(data).get();
        return data;
    }

    // Read document
    @GetMapping("/read")
    public Map<String, Object> readDocument(@RequestParam String docId) throws ExecutionException, InterruptedException {
        Firestore db = getDb();
        Map<String, Object> doc = db.collection("testCollection").document(docId).get().get().getData();
        if (doc == null) {
            doc = new HashMap<>();
            doc.put("message", "Document not found");
        }
        return doc;
    }

    // Delete document
    @DeleteMapping("/delete")
    public String deleteDocument(@RequestParam String docId) throws ExecutionException, InterruptedException {
        Firestore db = getDb();
        db.collection("testCollection").document(docId).delete().get();
        return "Deleted document: " + docId;
    }
}
