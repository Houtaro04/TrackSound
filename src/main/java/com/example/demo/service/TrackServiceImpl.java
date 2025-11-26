package com.example.demo.service;

import com.example.demo.model.Track;
import com.example.demo.repository.TrackRepository;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class TrackServiceImpl implements TrackService {

    private final TrackRepository trackRepository;
    private static final String BUCKET_NAME = "tracksound-93a54.appspot.com";
    private static final String DOWNLOAD_URL_FORMAT = "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media";

    @Override
    public Track uploadTrack(MultipartFile file, String artistId, String artistName) throws IOException, ExecutionException, InterruptedException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file.");
        }

        // 1. Upload file to Firebase Storage
        Storage storage = StorageOptions.getDefaultInstance().getService();
        String fileName = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();

        BlobId blobId = BlobId.of(BUCKET_NAME, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();

        storage.create(blobInfo, file.getBytes());
        String fileUrl = String.format(DOWNLOAD_URL_FORMAT, BUCKET_NAME, URLEncoder.encode(fileName, StandardCharsets.UTF_8));

        // 2. Create Track object
        Track track = new Track();
        track.setTitle(file.getOriginalFilename()); // Tạm lấy tên file làm title
        track.setArtistId(artistId);
        track.setArtistName(artistName);
        track.setFileUrl(fileUrl);
        track.setUploadedAt(new Date());

        // 3. Save track info to Firestore
        String savedId = trackRepository.save(track);
        track.setId(savedId);

        return track;
    }
}