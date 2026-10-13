package com.example.CourseSearch_App.controller;

import com.example.CourseSearch_App.entity.AppUser;
import com.example.CourseSearch_App.entity.Course;
import com.example.CourseSearch_App.entity.CourseMode;
import com.example.CourseSearch_App.entity.CourseType;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * What the API sends to the browser. The owner's email is deliberately left out so learners
 * never see provider emails. "editable" is true only for the provider who added the course.
 * It tells the app whether to show Edit and Delete.
 * The provider's logo, mobile number and website come from the company profile the provider filled in.
 */
public record CourseResponse(
        Long id,
        String title,
        String providerName,
        String category,
        String skills,
        String city,
        CourseMode mode,
        CourseType type,
        Integer durationMonths,
        Integer fees,
        LocalDate applyBy,
        String description,
        String websiteUrl,
        LocalDateTime createdAt,
        boolean editable,
        String providerLogoUrl,
        String providerPhone,
        String providerWebsite) {

    /** Courses saved before months existed only have weeks: show them as the nearest whole month. */
    private static Integer months(Course c) {
        if (c.getDurationMonths() != null) return c.getDurationMonths();
        return c.getDurationWeeks() == null ? null : Math.max(1, Math.round(c.getDurationWeeks() / 4f));
    }

    static CourseResponse of(Course c, boolean editable, AppUser owner) {
        return new CourseResponse(c.getId(), c.getTitle(), c.getProviderName(), c.getCategory(), c.getSkills(),
                c.getCity(), c.getMode(), c.getType(), months(c), c.getFees(), c.getApplyBy(), c.getDescription(),
                c.getWebsiteUrl(), c.getCreatedAt(), editable,
                owner == null ? "" : ProviderController.logoUrl(owner),
                owner == null || owner.getPhone() == null ? "" : owner.getPhone(),
                owner == null || owner.getWebsite() == null ? "" : owner.getWebsite());
    }
}
