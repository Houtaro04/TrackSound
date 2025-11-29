package com.example.demo.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RapidApiService {

    // Chú ý: Cuối dòng này mình để {query} làm chỗ giữ chỗ
    private final String ITUNES_API_URL = "https://itunes.apple.com/search?media=music&limit=100&term={query}";

    public String searchTracks(String query) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // CÁCH SỬA: 
            // Không dùng URLEncoder.encode thủ công nữa.
            // Truyền trực tiếp biến 'query' (Sơn Tùng) vào tham số thứ 3.
            // RestTemplate sẽ tự động mã hóa nó chuẩn theo định dạng URL.
            
            ResponseEntity<String> response = restTemplate.getForEntity(ITUNES_API_URL, String.class, query);
            
            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"resultCount\":0, \"results\": []}";
        }
    }
}