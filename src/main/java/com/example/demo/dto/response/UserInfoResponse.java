package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserInfoResponse {
    private String uid;
    private String email;
    private String name;
    private String picture;
}
