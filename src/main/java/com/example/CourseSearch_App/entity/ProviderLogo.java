package com.example.CourseSearch_App.entity;

import jakarta.persistence.*;

/**
 * A provider's company logo. Kept in its own table so loading a user (which happens on
 * every request) never has to read the image bytes.
 */
@Entity
@Table(name = "provider_logos")
public class ProviderLogo {

    @Id
    private Long userId;

    @Column(nullable = false, length = 40)
    private String contentType;

    // LONGBLOB: a plain BLOB holds only 64 KB, which is too small for most logos
    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    public ProviderLogo() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
}
