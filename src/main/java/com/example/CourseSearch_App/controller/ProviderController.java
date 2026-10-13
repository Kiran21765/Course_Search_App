package com.example.CourseSearch_App.controller;

import com.example.CourseSearch_App.entity.AppUser;
import com.example.CourseSearch_App.entity.ProviderLogo;
import com.example.CourseSearch_App.repository.LogoRepository;
import com.example.CourseSearch_App.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;

/**
 * Company details a provider adds after signing up: mobile number, website link and logo.
 * /api/provider/** is limited to the PROVIDER role in SecurityConfig.
 * Logos are served from /api/logos/{userId}, which is public so plain <img> tags can load them.
 */
@RestController
@RequestMapping("/api")
public class ProviderController {

    public record ProfileRequest(
            @NotBlank(message = "Organization name is required")
            @Size(max = 120, message = "Organization name is too long") String organization,
            @NotBlank(message = "Mobile number is required")
            @Size(max = 25, message = "Mobile number is too long") String phone,
            @NotBlank(message = "Company website link is required")
            @Size(max = 500, message = "Website address is too long") String website) {}

    public record ProfileResponse(String name, String email, String organization, String phone,
                                  String website, String logoUrl, boolean complete) {}

    private static final int MAX_LOGO_BYTES = 1024 * 1024;

    private final UserRepository users;
    private final LogoRepository logos;

    public ProviderController(UserRepository users, LogoRepository logos) {
        this.users = users;
        this.logos = logos;
    }

    // ---------------------------------------------------------------- helpers used elsewhere

    /** A provider must have a mobile number and a website before their courses are shown properly. */
    public static boolean isComplete(AppUser u) {
        return !isBlank(u.getPhone()) && !isBlank(u.getWebsite());
    }

    public static String logoUrl(AppUser u) {
        return u.getLogoVersion() == null ? "" : "/api/logos/" + u.getId() + "?v=" + u.getLogoVersion();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    // ---------------------------------------------------------------- profile

    @GetMapping("/provider/profile")
    public ProfileResponse profile(Authentication auth) {
        return toResponse(me(auth));
    }

    @Transactional
    @PutMapping("/provider/profile")
    public ProfileResponse save(@Valid @RequestBody ProfileRequest req, Authentication auth) {
        AppUser u = me(auth);
        u.setOrganization(req.organization().trim());
        u.setPhone(cleanPhone(req.phone()));
        u.setWebsite(WebUrl.clean(req.website()));
        return toResponse(users.save(u));
    }

    // ---------------------------------------------------------------- logo

    @Transactional
    @PostMapping(value = "/provider/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponse uploadLogo(@RequestParam("file") MultipartFile file, Authentication auth) throws IOException {
        AppUser u = me(auth);
        if (file.isEmpty()) throw bad("Choose an image first");
        if (file.getSize() > MAX_LOGO_BYTES) throw bad("That image is too large. Choose one under 1 MB");

        byte[] bytes = file.getBytes();
        // The type is read from the file's own first bytes, not from what the browser claims.
        // SVG is not accepted because it can contain scripts.
        String type = detectImageType(bytes);
        if (type == null) throw bad("Upload a PNG, JPG or WebP image");

        ProviderLogo logo = logos.findById(u.getId()).orElseGet(ProviderLogo::new);
        logo.setUserId(u.getId());
        logo.setContentType(type);
        logo.setData(bytes);
        logos.save(logo);

        u.setLogoVersion(System.currentTimeMillis());
        return toResponse(users.save(u));
    }

    @Transactional
    @DeleteMapping("/provider/logo")
    public ProfileResponse removeLogo(Authentication auth) {
        AppUser u = me(auth);
        logos.findById(u.getId()).ifPresent(logos::delete);
        u.setLogoVersion(null);
        return toResponse(users.save(u));
    }

    /** Public: lets <img src="/api/logos/5"> work without a login token. */
    @GetMapping("/logos/{userId}")
    public ResponseEntity<byte[]> logo(@PathVariable Long userId) {
        ProviderLogo logo = logos.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No logo"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(logo.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                .body(logo.getData());
    }

    // ---------------------------------------------------------------- private

    private AppUser me(Authentication auth) {
        return users.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again"));
    }

    private ProfileResponse toResponse(AppUser u) {
        return new ProfileResponse(
                u.getFullName() == null ? "" : u.getFullName(),
                u.getUsername(),
                u.getOrganization() == null ? "" : u.getOrganization(),
                u.getPhone() == null ? "" : u.getPhone(),
                u.getWebsite() == null ? "" : u.getWebsite(),
                logoUrl(u),
                isComplete(u));
    }

    /** Accepts +91 98765 43210, (022) 1234-5678 and similar: 7 to 15 digits plus spaces, dashes and brackets. */
    private String cleanPhone(String raw) {
        String p = raw.trim();
        int digits = p.replaceAll("\\D", "").length();
        if (!p.matches("^\\+?[0-9 ()\\-]{7,25}$") || digits < 7 || digits > 15) {
            throw bad("Enter a valid mobile number, for example +91 98765 43210");
        }
        return p;
    }

    private static String detectImageType(byte[] b) {
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
