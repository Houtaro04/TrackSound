package com.example.demo.controller;

import com.example.demo.model.Track;
import com.example.demo.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadTrack(@RequestParam("file") MultipartFile file,
                                           @RequestParam("artistId") String artistId,
                                           @RequestParam("artistName") String artistName) {
        try {
            Track savedTrack = trackService.uploadTrack(file, artistId, artistName);
            return ResponseEntity.ok(savedTrack);
        } catch (IOException | ExecutionException | InterruptedException e) {
            // Bắt thêm các exception từ Firestore
            Thread.currentThread().interrupt(); // Good practice
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file: " + e.getMessage());
        }
    }
}