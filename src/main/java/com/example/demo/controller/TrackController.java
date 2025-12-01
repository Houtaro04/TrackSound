package com.example.demo.controller;

import com.example.demo.model.Track;
import com.example.demo.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tracks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TrackController {

    private final TrackService trackService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadTrack(@RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "coverImage", required = false) MultipartFile coverImage,
                                         @RequestParam("title") String title,
                                         @RequestParam("artistId") String artistId,
                                         @RequestParam("artistName") String artistName) {
        try {
            Track savedTrack = trackService.uploadTrack(file, coverImage, title, artistId, artistName);
            return ResponseEntity.ok(savedTrack);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Track>> getAllTracks() {
        try {
            List<Track> tracks = trackService.getAllTracks();
            return ResponseEntity.ok(tracks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<Track>> getTracksByArtist(@PathVariable String artistId) {
        try {
            List<Track> tracks = trackService.getTracksByArtist(artistId);
            return ResponseEntity.ok(tracks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @DeleteMapping("/{trackId}")
    public ResponseEntity<?> deleteTrack(@PathVariable String trackId, @RequestParam String artistId) {
        try {
            trackService.deleteTrack(trackId, artistId);
            return ResponseEntity.ok("Xóa thành công!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
        }
    }
    @PutMapping("/{trackId}")
    public ResponseEntity<?> updateTrackTitle(@PathVariable String trackId, 
                                            @RequestParam String artistId, 
                                            @RequestParam String newTitle) {
        try {
            trackService.updateTrackTitle(trackId, artistId, newTitle);
            return ResponseEntity.ok("Đổi tên thành công!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}