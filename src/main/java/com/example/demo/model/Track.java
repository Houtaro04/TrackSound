package com.example.demo.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Track {
    @DocumentId
    private String id;
    private String title;
    
    // Thêm trường này vào để khớp với setArtistId bên Service
    private String artistId; 
    
    private String artistName;
    
    // Đổi tên từ 'url' thành 'fileUrl' để khớp với setFileUrl bên Service
    private String fileUrl; 
    
    private String coverUrl;
    private java.util.Date uploadedAt;
}