package com.example.CourseSearch_App.entity;

public enum Role {
    USER,      // read-only: can search and view courses
    PROVIDER,  // full CRUD on courses
    ADMIN      // full CRUD on courses
}
