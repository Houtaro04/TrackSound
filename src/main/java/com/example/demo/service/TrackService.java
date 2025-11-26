package com.example.demo.service;

import com.example.demo.model.Track;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

public interface TrackService {
    Track uploadTrack(MultipartFile file, String artistId, String artistName) throws IOException, ExecutionException, InterruptedException;
}