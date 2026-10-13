package com.example.CourseSearch_App.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The sign-in name. This is the person's email address (stored in lower case). */
    @Column(nullable = false, unique = true, length = 120)
    private String username;

    @Column(length = 100)
    private String fullName;

    @Column(nullable = false)
    private String password; // BCrypt hash

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Provider's organization name (shown on their courses). Empty for learners. */
    @Column(length = 120)
    private String organization;

    /** Provider's contact mobile number. Shown to learners on the provider's courses. */
    @Column(length = 25)
    private String phone;

    /** Provider's company website (http or https). */
    @Column(length = 500)
    private String website;

    /** null = no logo. Changes on every upload so browsers fetch the new image. */
    private Long logoVersion;

    public AppUser() {}

    public AppUser(String email, String fullName, String password, Role role, String organization) {
        this.username = email;
        this.fullName = fullName;
        this.password = password;
        this.role = role;
        this.organization = organization;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Long getLogoVersion() { return logoVersion; }
    public void setLogoVersion(Long logoVersion) { this.logoVersion = logoVersion; }
}
