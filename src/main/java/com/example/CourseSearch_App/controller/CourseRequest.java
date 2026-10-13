package com.example.CourseSearch_App.controller;

import com.example.CourseSearch_App.entity.CourseMode;
import com.example.CourseSearch_App.entity.CourseType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * What a provider may send when adding or editing a course.
 * The owner, id and created date are never taken from the client.
 */
public record CourseRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title is too long")
        String title,

        @NotBlank(message = "Provider name is required")
        @Size(max = 120, message = "Provider name is too long")
        String providerName,

        @NotBlank(message = "Category is required")
        @Size(max = 60, message = "Category is too long")
        String category,

        @Size(max = 500, message = "Skills list is too long")
        String skills,

        @Size(max = 80, message = "City name is too long")
        String city,

        @NotNull(message = "Choose a course mode")
        CourseMode mode,

        @NotNull(message = "Choose Paid or Free")
        CourseType type,

        @NotNull(message = "Duration is required")
        @Min(value = 1, message = "Duration must be at least 1 month")
        @Max(value = 120, message = "Duration cannot be more than 120 months")
        Integer durationMonths,

        /** Required for paid courses, ignored for free ones. */
        @Min(value = 0, message = "Fees cannot be negative")
        @Max(value = 10_000_000, message = "Fees are too high")
        Integer fees,

        @NotNull(message = "Apply by date is required")
        LocalDate applyBy,

        @Size(max = 2000, message = "Description is too long")
        String description,

        @Size(max = 500, message = "Website address is too long")
        String websiteUrl) {
}
