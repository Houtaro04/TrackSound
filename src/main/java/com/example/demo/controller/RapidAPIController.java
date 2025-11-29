package com.example.demo.controller;

import com.example.demo.service.RapidApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rapid")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép file HTML gọi API này
public class RapidAPIController {

    private final RapidApiService rapidApiService;

    // API tìm kiếm và lấy link nhạc
    // Gọi thử: http://localhost:8080/api/rapid/search?q=SonTung
    @GetMapping("/search")
    public ResponseEntity<?> searchMusic(@RequestParam("q") String query) {
        String jsonResult = rapidApiService.searchTracks(query);
        return ResponseEntity.ok(jsonResult);
    }
}