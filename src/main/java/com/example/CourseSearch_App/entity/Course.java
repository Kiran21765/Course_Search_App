package com.example.CourseSearch_App.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    /** Organization that runs the course, shown as "at <providerName>". */
    @Column(nullable = false, length = 120)
    private String providerName;

    @Column(nullable = false, length = 60)
    private String category;

    /** Comma-separated, e.g. "Java,Spring Boot,SQL". Empty string when none. */
    @Column(nullable = false, length = 500)
    private String skills = "";

    /** Empty for online courses that are not tied to a city. */
    @Column(nullable = false, length = 80)
    private String city = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "course_mode", nullable = false, length = 20)
    private CourseMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "course_type", nullable = false, length = 20)
    private CourseType type;

    /**
     * Kept in step with durationMonths (months x 4) so older databases, where this column is NOT NULL,
     * keep working and "shortest / longest first" sorting needs no change.
     */
    @Column(nullable = false)
    private Integer durationWeeks;

    /** Duration shown to learners, e.g. "3 Months". Null only for courses saved before this field existed. */
    private Integer durationMonths;

    /** Fee in rupees for paid courses. Null for free courses. */
    private Integer fees;

    /** Last day to apply. Null only for courses saved before this field existed. */
    private LocalDate applyBy;

    @Column(length = 2000)
    private String description = "";

    /** Provider's own website (http or https). Empty when not given. */
    @Column(nullable = false, length = 500)
    private String websiteUrl = "";

    /** Username of the provider who created the course. Set by the server only. */
    @Column(nullable = false, length = 60)
    private String ownerUsername;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Course() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public CourseMode getMode() { return mode; }
    public void setMode(CourseMode mode) { this.mode = mode; }
    public CourseType getType() { return type; }
    public void setType(CourseType type) { this.type = type; }
    public Integer getDurationWeeks() { return durationWeeks; }
    public void setDurationWeeks(Integer durationWeeks) { this.durationWeeks = durationWeeks; }
    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }
    public Integer getFees() { return fees; }
    public void setFees(Integer fees) { this.fees = fees; }
    public LocalDate getApplyBy() { return applyBy; }
    public void setApplyBy(LocalDate applyBy) { this.applyBy = applyBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
