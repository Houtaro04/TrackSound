package com.example.demo.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class Track {
    @DocumentId
    private String id;
    private String title;
    private String artistId; // ID của người dùng đã upload
    private String artistName;
    private String fileUrl;
    private Date uploadedAt;
}