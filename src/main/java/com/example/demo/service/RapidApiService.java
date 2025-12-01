package com.example.demo.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RapidApiService {

    // URL gốc, bỏ phần params đi để tự ghép
    private final String ITUNES_BASE_URL = "https://itunes.apple.com/search?media=music&limit=10";

    // Hàm search linh hoạt: tìm bài hát (song) hoặc nghệ sĩ (musicArtist)
    public String searchContent(String query, String entityType) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // entityType: "song" (bài hát) hoặc "musicArtist" (nghệ sĩ)
            String url = ITUNES_BASE_URL + "&term={query}&entity=" + entityType;

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class, query);
            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"resultCount\":0, \"results\": []}";
        }
    }
}