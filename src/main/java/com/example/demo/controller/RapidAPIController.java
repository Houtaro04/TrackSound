package com.example.demo.controller;

import com.example.demo.service.RapidApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rapid")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RapidAPIController {

    private final RapidApiService rapidApiService;

    // API Tìm kiếm đa năng
    // Gọi: /search?q=SonTung&type=song (Tìm bài)
    // Gọi: /search?q=SonTung&type=musicArtist (Tìm người)
    @GetMapping("/search")
    public ResponseEntity<?> searchMusic(@RequestParam("q") String query, 
                                         @RequestParam(value = "type", defaultValue = "song") String type) {
        String jsonResult = rapidApiService.searchContent(query, type);
        return ResponseEntity.ok(jsonResult);
    }

    @GetMapping("/trending")
    public ResponseEntity<?> getTrending() {
        // Mặc định trending là tìm bài hát (song)
        String jsonResult = rapidApiService.searchContent("Vpop", "song");
        return ResponseEntity.ok(jsonResult);
    }
}