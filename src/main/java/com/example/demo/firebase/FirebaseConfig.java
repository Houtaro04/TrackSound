package com.example.demo.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource; // Nhớ Import cái này
import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-file}")
    private String serviceAccountFile;

    @PostConstruct
    public void init() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.warn("Firebase has already been initialized.");
                return;
            }

            logger.info("Initializing Firebase with service account: {}", serviceAccountFile);

            ClassPathResource resource = new ClassPathResource(serviceAccountFile);

            InputStream serviceAccount = resource.getInputStream();

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
            logger.info(">>> Firebase has been initialized successfully! <<<");

        } catch (IOException e) {
            logger.error(">>> ERROR: Could not read Firebase service account file: {}", serviceAccountFile, e);
        }
    }
}