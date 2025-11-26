// src/main/java/com/tracksound/repository/TrackRepository.java
package com.example.demo.repository;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.example.demo.model.Track;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class TrackRepository {

    private static final String COLLECTION_NAME = "tracks";

    public String save(Track track) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        return db.collection(COLLECTION_NAME)
                .add(track)
                .get()
                .getId();
    }

    public Track findById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        var docRef = db.collection(COLLECTION_NAME).document(id).get().get();
        if (docRef.exists()) {
            return docRef.toObject(Track.class);
        }
        return null;
    }

    public List<Track> findAll() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        var snapshot = db.collection(COLLECTION_NAME).get().get();
        List<Track> tracks = new ArrayList<>();
        for (var doc : snapshot.getDocuments()) {
            Track track = doc.toObject(Track.class);
            track.setId(doc.getId());
            tracks.add(track);
        }
        return tracks;
    }

    public void update(String id, Track track) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).set(track).get();
    }

    public void delete(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }

    // Tìm theo artist
    public List<Track> findByArtistId(String artistId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        var query = db.collection(COLLECTION_NAME)
                .whereEqualTo("artistId", artistId)
                .get()
                .get();

        List<Track> tracks = new ArrayList<>();
        for (var doc : query.getDocuments()) {
            Track track = doc.toObject(Track.class);
            track.setId(doc.getId());
            tracks.add(track);
        }
        return tracks;
    }
}