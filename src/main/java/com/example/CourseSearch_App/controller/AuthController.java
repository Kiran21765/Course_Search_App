package com.example.CourseSearch_App.controller;

import com.example.CourseSearch_App.entity.AppUser;
import com.example.CourseSearch_App.entity.Role;
import com.example.CourseSearch_App.repository.UserRepository;
import com.example.CourseSearch_App.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;

/**
 * Learners use /login and /register. People sign up with a name, an email and a password,
 * and sign in with the email and password.
 * Providers (and the admin) use /provider/*, which always needs the access code from application.properties.
 * The code is checked here on the server, so skipping the access-code screen in the browser does not help.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String NAME_MSG = "Enter your full name";
    private static final String EMAIL_MSG = "Enter a valid email address";
    private static final String PASSWORD_MSG = "Password must be at least 8 characters";

    public record LoginRequest(
            @NotBlank(message = EMAIL_MSG) @Email(message = EMAIL_MSG) String email,
            @NotBlank(message = "Enter your password") String password) {}

    public record RegisterRequest(
            @NotBlank(message = NAME_MSG) @Size(max = 100, message = "Name is too long") String name,
            @NotBlank(message = EMAIL_MSG) @Email(message = EMAIL_MSG) @Size(max = 120, message = "Email is too long") String email,
            @NotBlank(message = PASSWORD_MSG) @Size(min = 8, max = 100, message = PASSWORD_MSG) String password) {}

    public record CodeRequest(@NotBlank(message = "Enter the access code") String accessCode) {}

    public record ProviderLoginRequest(
            @NotBlank(message = EMAIL_MSG) @Email(message = EMAIL_MSG) String email,
            @NotBlank(message = "Enter your password") String password,
            @NotBlank(message = "Enter the access code") String accessCode) {}

    public record ProviderRegisterRequest(
            @NotBlank(message = NAME_MSG) @Size(max = 100, message = "Name is too long") String name,
            @NotBlank(message = EMAIL_MSG) @Email(message = EMAIL_MSG) @Size(max = 120, message = "Email is too long") String email,
            @NotBlank(message = PASSWORD_MSG) @Size(min = 8, max = 100, message = PASSWORD_MSG) String password,
            @NotBlank(message = "Organization name is required")
            @Size(max = 120, message = "Organization name is too long") String organization,
            @NotBlank(message = "Enter the access code") String accessCode) {}

    public record AuthResponse(String token, String email, String name, String role, String organization,
                               boolean profileComplete, String logoUrl) {}

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;
    private final String providerAccessCode;

    public AuthController(UserRepository users, PasswordEncoder encoder, AuthenticationManager authManager,
                          JwtService jwt, @Value("${app.provider.access-code}") String providerAccessCode) {
        this.users = users;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwt = jwt;
        this.providerAccessCode = providerAccessCode;
    }

    // ------------------------------------------------------------ learners

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        AppUser u = authenticate(req.email(), req.password());
        if (u.getRole() != Role.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Providers sign in on the provider login page");
        }
        return respond(u);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = clean(req.email());
        ensureEmailFree(email);
        AppUser u = new AppUser(email, req.name().trim(), encoder.encode(req.password()), Role.USER, "");
        return respond(users.save(u));
    }

    // ------------------------------------------------------------ providers

    /** Step 1 of the provider page: lets the browser check the code before showing the forms. */
    @PostMapping("/provider/verify-code")
    public Map<String, Boolean> verifyCode(@Valid @RequestBody CodeRequest req) {
        checkAccessCode(req.accessCode());
        return Map.of("valid", true);
    }

    @PostMapping("/provider/login")
    public AuthResponse providerLogin(@Valid @RequestBody ProviderLoginRequest req) {
        checkAccessCode(req.accessCode());
        AppUser u = authenticate(req.email(), req.password());
        if (u.getRole() == Role.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This is a learner account. Please use the learner sign in page");
        }
        return respond(u);
    }

    @PostMapping("/provider/register")
    public AuthResponse providerRegister(@Valid @RequestBody ProviderRegisterRequest req) {
        checkAccessCode(req.accessCode());
        String email = clean(req.email());
        ensureEmailFree(email);
        AppUser u = new AppUser(email, req.name().trim(), encoder.encode(req.password()),
                Role.PROVIDER, req.organization().trim());
        return respond(users.save(u));
    }

    // ------------------------------------------------------------ helpers

    /** Emails are compared in lower case so "Ana@Mail.com" and "ana@mail.com" are the same account. */
    private String clean(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void checkAccessCode(String code) {
        byte[] given = code.trim().getBytes(StandardCharsets.UTF_8);
        byte[] expected = providerAccessCode.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(given, expected)) { // constant-time comparison
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That access code is not correct");
        }
    }

    private AppUser authenticate(String email, String password) {
        String e = clean(email);
        authManager.authenticate(new UsernamePasswordAuthenticationToken(e, password));
        return users.findByUsername(e).orElseThrow();
    }

    private void ensureEmailFree(String email) {
        if (users.existsByUsername(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists. Try signing in instead");
        }
    }

    private AuthResponse respond(AppUser u) {
        return new AuthResponse(jwt.generateToken(u.getUsername(), u.getRole().name()),
                u.getUsername(),
                u.getFullName() == null ? "" : u.getFullName(),
                u.getRole().name(),
                u.getOrganization() == null ? "" : u.getOrganization(),
                ProviderController.isComplete(u),
                ProviderController.logoUrl(u));
    }
}
