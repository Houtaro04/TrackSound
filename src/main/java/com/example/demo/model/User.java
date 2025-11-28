package com.example.demo.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @DocumentId
    private String firebaseUid; // Dùng UID của Firebase làm ID cho document
    private String email;
    private String name;
    private String picture;
    private Date createdAt;
}