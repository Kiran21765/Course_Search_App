package com.example.CourseSearch_App.repository;

import com.example.CourseSearch_App.entity.ProviderLogo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogoRepository extends JpaRepository<ProviderLogo, Long> {
}
