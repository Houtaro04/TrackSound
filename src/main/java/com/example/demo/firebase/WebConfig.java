package com.example.demo.firebase; // Đảm bảo đúng tên package của bạn

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình: Khi ai đó gọi đường dẫn /uploads/**
        // Thì server sẽ lấy file thật trong thư mục uploads/ ở gốc dự án
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}