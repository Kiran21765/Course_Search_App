package com.example.CourseSearch_App.repository;

import com.example.CourseSearch_App.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/** Searching and filtering use JpaSpecificationExecutor (see CourseController.filterBy). */
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {

    @Query("SELECT DISTINCT c.category FROM Course c ORDER BY c.category")
    List<String> findCategories();

    @Query("SELECT DISTINCT c.city FROM Course c WHERE c.city <> '' ORDER BY c.city")
    List<String> findCities();

    @Query("SELECT c.skills FROM Course c WHERE c.skills <> ''")
    List<String> findSkillLists();
}
