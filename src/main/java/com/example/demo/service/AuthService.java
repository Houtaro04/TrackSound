package com.example.demo.service;

import com.example.demo.dto.response.UserInfoResponse;
import com.google.firebase.auth.FirebaseAuthException;

public interface AuthService {
    UserInfoResponse loginWithGoogle(String idToken) throws FirebaseAuthException;
}