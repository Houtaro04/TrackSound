package com.example.demo.service;

import com.example.demo.dto.response.UserInfoResponse;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;

    @Override
    public UserInfoResponse loginWithGoogle(String idToken) throws FirebaseAuthException {
        // Xác thực ID Token bằng Firebase Admin SDK
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

        // Lấy thông tin người dùng từ token đã được giải mã
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        String picture = decodedToken.getPicture();

        // Kiểm tra xem người dùng đã tồn tại trong Firestore chưa
        try {
            userRepository.findById(uid).orElseGet(() -> {
                // Nếu chưa tồn tại, tạo người dùng mới (đây là logic cho "Create Account")
                User newUser = User.builder()
                        .firebaseUid(uid)
                        .email(email)
                        .name(name)
                        .picture(picture)
                        .createdAt(new Date())
                        .build();
                userRepository.save(newUser);
                return newUser;
            });
        } catch (ExecutionException | InterruptedException e) {
            // Xử lý lỗi khi giao tiếp với Firestore
            Thread.currentThread().interrupt();
            throw new RuntimeException("Error while checking or creating user in Firestore", e);
        }

        // Nếu đã tồn tại hoặc vừa tạo xong, trả về thông tin (đây là logic cho "Sign In")

        return UserInfoResponse.builder()
                .uid(uid)
                .email(email)
                .name(name)
                .picture(picture)
                .build();
    }
}