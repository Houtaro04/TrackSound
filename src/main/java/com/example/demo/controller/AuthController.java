package com.example.demo.controller;

import com.example.demo.dto.request.GoogleLoginRequest;
import com.example.demo.dto.response.UserInfoResponse;
import com.example.demo.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google-login")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest loginRequest) {
        try {
            UserInfoResponse userInfo = authService.loginWithGoogle(loginRequest.getIdToken());
            return ResponseEntity.ok(userInfo);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google ID Token: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + e.getMessage());
        }
    }
}