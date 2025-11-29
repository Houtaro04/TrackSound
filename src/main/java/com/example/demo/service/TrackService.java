package com.example.demo.service;

import com.example.demo.model.Track;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.List;

public interface TrackService {
    List<Track> getAllTracks() throws ExecutionException, InterruptedException;
    List<Track> getTracksByArtist(String artistId) throws ExecutionException, InterruptedException;
    Track uploadTrack(MultipartFile file, MultipartFile coverImage, String title, String artistId, String artistName) throws IOException, ExecutionException, InterruptedException;
    void deleteTrack(String trackId, String artistId) throws ExecutionException, InterruptedException, IOException;
}