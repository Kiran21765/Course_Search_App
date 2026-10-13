package com.example.CourseSearch_App.config;

import com.example.CourseSearch_App.entity.AppUser;
import com.example.CourseSearch_App.entity.Role;
import com.example.CourseSearch_App.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Creates the one admin account on first start so someone can sign in.
 * No courses or other sample data are created. Set app.admin.password to empty to skip it.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.email:admin@coursehub.example}") String email,
                       @Value("${app.admin.password:}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (password.isBlank() || users.existsByUsername(email)) return;
        users.save(new AppUser(email, "Administrator", encoder.encode(password), Role.ADMIN, "Administrator"));
    }
}
