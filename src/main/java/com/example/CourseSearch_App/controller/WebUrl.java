package com.example.CourseSearch_App.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Only real http/https addresses are stored. This blocks values like "javascript:..."
 * that could run code when someone clicks the link.
 */
final class WebUrl {

    private WebUrl() {}

    /** Returns the trimmed address, "" when blank, or throws 400 when it is not a valid http/https address. */
    static String clean(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String u = raw.trim();
        try {
            URI uri = new URI(u);
            String scheme = uri.getScheme();
            boolean okScheme = scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
            if (okScheme && uri.getHost() != null) return u;
        } catch (URISyntaxException ignored) {
            // falls through to the error below
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Enter a full website address that starts with http:// or https://");
    }
}
