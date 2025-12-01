package com.example.demo.service;

import com.example.demo.model.Track;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient; // Vẫn dùng Firestore để lưu thông tin bài hát (text), chỉ bỏ Storage (file)
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
public class TrackServiceImpl implements TrackService {

    // Đường dẫn thư mục lưu file (Nằm ngay trong thư mục project của bạn)
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    // Constructor: Tạo thư mục uploads nếu chưa có
    @PostConstruct // Hàm này sẽ tự chạy ngay sau khi class được tạo
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Không thể tạo thư mục upload.", ex);
        }
    }

    @Override
    public Track uploadTrack(MultipartFile file, MultipartFile coverImage, String title, String artistId, String artistName) throws IOException, ExecutionException, InterruptedException {
        
        // --- 1. LƯU FILE NHẠC VÀO Ổ CỨNG ---
        String audioFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename(); // Tạo tên file không trùng
        Path targetAudioLocation = this.fileStorageLocation.resolve(audioFileName);
        Files.copy(file.getInputStream(), targetAudioLocation, StandardCopyOption.REPLACE_EXISTING);

        // Tạo đường dẫn để truy cập (http://localhost:8080/uploads/...)
        String fileUrl = "http://localhost:8080/api/uploads/" + audioFileName;

        // --- 2. LƯU ẢNH BÌA VÀO Ổ CỨNG (NẾU CÓ) ---
        String coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300"; // Ảnh mặc định
        
        if (coverImage != null && !coverImage.isEmpty()) {
            String imageFileName = UUID.randomUUID().toString() + "_" + coverImage.getOriginalFilename();
            Path targetImageLocation = this.fileStorageLocation.resolve(imageFileName);
            Files.copy(coverImage.getInputStream(), targetImageLocation, StandardCopyOption.REPLACE_EXISTING);
            
            coverUrl = "http://localhost:8080/api/uploads/" + imageFileName;
        }

        // --- 3. LƯU THÔNG TIN VÀO FIREBASE FIRESTORE (Database Text vẫn dùng Firebase vì nó miễn phí và nhanh) ---
        // Nếu bạn muốn bỏ hoàn toàn Firebase thì phải cài MySQL/MongoDB, nhưng tôi khuyên nên giữ Firestore cho phần Text.
        Track track = new Track();
        String trackId = UUID.randomUUID().toString();
        
        track.setId(trackId);
        track.setTitle(title);
        track.setArtistId(artistId);
        track.setArtistName(artistName);
        track.setFileUrl(fileUrl);
        track.setCoverUrl(coverUrl); 

        Firestore db = FirestoreClient.getFirestore();
        db.collection("tracks").document(trackId).set(track);

        return track;
    }

    // --- CÁC HÀM GET DỮ LIỆU (GIỮ NGUYÊN) ---
    @Override
    public List<Track> getAllTracks() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection("tracks").get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Track> trackList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            trackList.add(document.toObject(Track.class));
        }
        return trackList;
    }

    @Override
    public List<Track> getTracksByArtist(String artistId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection("tracks").whereEqualTo("artistId", artistId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Track> trackList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            trackList.add(document.toObject(Track.class));
        }
        return trackList;
    }
    @Override
    public void deleteTrack(String trackId, String artistId) throws ExecutionException, InterruptedException, IOException {
        Firestore db = FirestoreClient.getFirestore();
        
        // 1. Lấy thông tin bài hát để biết đường dẫn file mà xóa
        Track track = db.collection("tracks").document(trackId).get().get().toObject(Track.class);
        
        if (track == null) {
            throw new RuntimeException("Bài hát không tồn tại!");
        }

        // 2. Kiểm tra quyền (Chỉ chủ bài hát mới được xóa)
        if (!track.getArtistId().equals(artistId)) {
            throw new RuntimeException("Bạn không có quyền xóa bài này!");
        }

        // 3. Xóa file nhạc trong thư mục uploads
        if (track.getFileUrl() != null) {
            // Link dạng: http://localhost:8080/api/uploads/ten-file.mp3
            // Cắt lấy phần tên file cuối cùng
            String fileName = track.getFileUrl().substring(track.getFileUrl().lastIndexOf("/") + 1);
            Path filePath = this.fileStorageLocation.resolve(fileName);
            Files.deleteIfExists(filePath);
        }

        // 4. Xóa file ảnh trong thư mục uploads (nếu có và không phải ảnh mặc định)
        if (track.getCoverUrl() != null && track.getCoverUrl().contains("/uploads/")) {
            String imageName = track.getCoverUrl().substring(track.getCoverUrl().lastIndexOf("/") + 1);
            Path imagePath = this.fileStorageLocation.resolve(imageName);
            Files.deleteIfExists(imagePath);
        }

        // 5. Xóa dữ liệu trong Firestore
        db.collection("tracks").document(trackId).delete();
    }
    @Override
    public void updateTrackTitle(String trackId, String artistId, String newTitle) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference trackRef = db.collection("tracks").document(trackId);
        
        // Kiểm tra quyền (chỉ chủ bài hát được sửa)
        Track track = trackRef.get().get().toObject(Track.class);
        if (track == null || !track.getArtistId().equals(artistId)) {
            throw new RuntimeException("Không có quyền sửa!");
        }

        // Cập nhật title
        trackRef.update("title", newTitle);
    }
}