package com.example.demo.service;

import com.example.demo.model.Track;
import com.example.demo.repository.TrackRepository;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.google.firebase.cloud.FirestoreClient;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.List;

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

    @Override
    public List<Track> getAllTracks() throws ExecutionException, InterruptedException {
        // 1. Lấy instance của Firestore
        Firestore db = FirestoreClient.getFirestore();
        
        // 2. Trỏ vào collection "tracks" (nơi bạn lưu thông tin bài hát)
        CollectionReference tracksCollection = db.collection("tracks");
        
        // 3. Lấy toàn bộ dữ liệu (Asynchronous)
        ApiFuture<QuerySnapshot> future = tracksCollection.get();
        
        // 4. Chờ kết quả trả về
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        // 5. Chuyển đổi từ Document Firestore sang Java Object (Track)
        List<Track> trackList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            // Firestore tự động map các trường trong JSON vào class Track
            Track track = document.toObject(Track.class);
            trackList.add(track);
        }
        
        return trackList;
    }
}