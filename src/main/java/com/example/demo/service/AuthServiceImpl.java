package com.example.demo.service;

import com.example.demo.dto.response.UserInfoResponse;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Override
    public UserInfoResponse loginWithGoogle(String idToken) throws FirebaseAuthException {
        // Xác thực ID Token bằng Firebase Admin SDK
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

        // Lấy thông tin người dùng từ token đã được giải mã
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        String picture = decodedToken.getPicture();

        // Tại đây, bạn có thể thêm logic để lưu/cập nhật người dùng vào database của mình
        // Ví dụ: userRepository.findByFirebaseUid(uid).orElseGet(() -> userRepository.save(new User(...)));

        return UserInfoResponse.builder()
                .uid(uid)
                .email(email)
                .name(name)
                .picture(picture)
                .build();
    }
}