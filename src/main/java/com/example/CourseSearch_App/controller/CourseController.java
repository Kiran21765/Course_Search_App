package com.example.CourseSearch_App.controller;

import com.example.CourseSearch_App.entity.AppUser;
import com.example.CourseSearch_App.entity.Course;
import com.example.CourseSearch_App.entity.CourseMode;
import com.example.CourseSearch_App.entity.CourseType;
import com.example.CourseSearch_App.repository.CourseRepository;
import com.example.CourseSearch_App.repository.UserRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Access rules live in SecurityConfig:
 *   GET                 -> USER, PROVIDER, ADMIN
 *   POST / PUT / DELETE -> PROVIDER, ADMIN
 * On top of that, only the provider who added a course can edit or delete it (nobody else, admin included).
 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    public record FilterOptions(List<String> categories, List<String> cities, List<String> skills) {}

    private static final char ESC = '!';
    private static final List<String> SEARCH_FIELDS =
            List.of("title", "providerName", "category", "skills", "city", "description");

    private final CourseRepository courses;
    private final UserRepository users;

    public CourseController(CourseRepository courses, UserRepository users) {
        this.courses = courses;
        this.users = users;
    }

    // ---------------------------------------------------------------- read

    /**
     * Search rules (so results match the letters typed):
     *  - the text is split into words and EVERY word must be found in the title, provider, category,
     *    skills, city or description
     *  - a word of 1 or 2 letters must be the START of a word ("ja" finds Java and Jaipur, not "Bangalore")
     *  - a word of 3 or more letters can be found anywhere ("script" finds JavaScript)
     *  - sortBy=relevance puts titles that start with the first word on top
     */
    @GetMapping
    public Page<CourseResponse> search(Authentication auth,
                                       @RequestParam(defaultValue = "") String q,
                                       @RequestParam(defaultValue = "") String category,
                                       @RequestParam(defaultValue = "") String city,
                                       @RequestParam(defaultValue = "") String skill,
                                       @RequestParam(required = false) CourseType type,
                                       @RequestParam(required = false) CourseMode mode,
                                       @RequestParam(defaultValue = "relevance") String sortBy,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "9") int size) {
        List<String> words = tokenize(q);
        boolean byRelevance = sortBy.equals("relevance") && !words.isEmpty();

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        // For relevance the ORDER BY is added inside the specification, so the pageable has no sort
        Pageable pageable = byRelevance ? PageRequest.of(safePage, safeSize)
                                        : PageRequest.of(safePage, safeSize, sortFor(sortBy));

        Page<Course> result = courses.findAll(
                filterBy(words, category.trim(), city.trim(), skill.trim(), type, mode, byRelevance), pageable);

        Map<String, AppUser> owners = ownersOf(result.getContent());
        return result.map(c -> toResponse(c, auth, owners.get(c.getOwnerUsername())));
    }

    /** Values for the Categories, City and Skills dropdowns, built from the courses that exist. */
    @GetMapping("/filters")
    public FilterOptions filters() {
        Map<String, String> skills = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (String list : courses.findSkillLists()) {
            for (String s : list.split(",")) {
                String t = s.trim();
                if (!t.isEmpty()) skills.putIfAbsent(t, t);
            }
        }
        return new FilterOptions(courses.findCategories(), courses.findCities(), new ArrayList<>(skills.values()));
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable Long id, Authentication auth) {
        Course c = find(id);
        return toResponse(c, auth, ownerOf(c));
    }

    // ---------------------------------------------------------------- write

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@Valid @RequestBody CourseRequest req, Authentication auth) {
        Course c = new Course();
        apply(c, req, true);
        c.setOwnerUsername(auth.getName());
        Course saved = courses.save(c);
        return toResponse(saved, auth, ownerOf(saved));
    }

    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest req, Authentication auth) {
        Course c = find(id);
        requireOwner(c, auth);
        apply(c, req, false);
        Course saved = courses.save(c);
        return toResponse(saved, auth, ownerOf(saved));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        Course c = find(id);
        requireOwner(c, auth);
        courses.delete(c);
    }

    // ---------------------------------------------------------------- helpers

    private Course find(Long id) {
        return courses.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    /** Only the account that added the course may change it. */
    private boolean canChange(Course c, Authentication auth) {
        return c.getOwnerUsername().equals(auth.getName());
    }

    private void requireOwner(Course c, Authentication auth) {
        if (!canChange(c, auth)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the provider who added this course can change it");
        }
    }

    private AppUser ownerOf(Course c) {
        return users.findByUsername(c.getOwnerUsername()).orElse(null);
    }

    /** One query for all owners on a page, instead of one per course. */
    private Map<String, AppUser> ownersOf(Collection<Course> list) {
        Set<String> names = list.stream().map(Course::getOwnerUsername).collect(Collectors.toSet());
        if (names.isEmpty()) return Map.of();
        return users.findByUsernameIn(names).stream().collect(Collectors.toMap(AppUser::getUsername, u -> u));
    }

    private CourseResponse toResponse(Course c, Authentication auth, AppUser owner) {
        // A learner is never the owner, so for learners "editable" is always false
        return CourseResponse.of(c, canChange(c, auth), owner);
    }

    private void apply(Course c, CourseRequest r, boolean isNew) {
        String city = r.city() == null ? "" : r.city().trim();
        if (r.mode() != CourseMode.ONLINE && city.isEmpty()) {
            throw bad("City is required for offline and hybrid courses");
        }
        c.setTitle(r.title().trim());
        c.setProviderName(r.providerName().trim());
        c.setCategory(r.category().trim());
        c.setSkills(normalizeSkills(r.skills()));
        c.setCity(city);
        c.setMode(r.mode());
        c.setType(r.type());
        c.setDurationMonths(r.durationMonths());
        c.setDurationWeeks(r.durationMonths() * 4);
        if (r.type() == CourseType.PAID) {
            if (r.fees() == null || r.fees() < 1) throw bad("Enter the fees for a paid course");
            c.setFees(r.fees());
        } else {
            c.setFees(null);
        }
        // A new listing cannot start in the past. When editing, an unchanged (possibly passed) date is fine.
        if (r.applyBy().isBefore(LocalDate.now()) && (isNew || !r.applyBy().equals(c.getApplyBy()))) {
            throw bad("Apply by date cannot be in the past");
        }
        c.setApplyBy(r.applyBy());
        c.setDescription(r.description() == null ? "" : r.description().trim());
        c.setWebsiteUrl(WebUrl.clean(r.websiteUrl()));
    }

    /** "Java, spring boot ,java" -> "Java,spring boot" (trimmed, no blanks, no duplicates). */
    private String normalizeSkills(String raw) {
        if (raw == null) return "";
        Map<String, String> seen = new LinkedHashMap<>();
        for (String s : raw.split(",")) {
            String t = s.trim();
            if (!t.isEmpty()) seen.putIfAbsent(t.toLowerCase(Locale.ROOT), t);
        }
        String joined = String.join(",", seen.values());
        if (joined.length() > 500) throw bad("Skills list is too long");
        return joined;
    }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private Sort sortFor(String sortBy) {
        Sort s = switch (sortBy) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            case "duration_asc" -> Sort.by(Sort.Direction.ASC, "durationWeeks");
            case "duration_desc" -> Sort.by(Sort.Direction.DESC, "durationWeeks");
            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // newest first (also used for "relevance" with no text)
        };
        return s.and(Sort.by(Sort.Direction.DESC, "id"));
    }

    private static List<String> tokenize(String q) {
        List<String> words = new ArrayList<>();
        for (String w : q.trim().toLowerCase(Locale.ROOT).split("\\s+")) {
            if (!w.isEmpty() && words.size() < 6) words.add(w);
        }
        return words;
    }

    /** Builds the WHERE clause. A filter left empty is simply not applied. */
    private Specification<Course> filterBy(List<String> words, String category, String city, String skill,
                                           CourseType type, CourseMode mode, boolean byRelevance) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();

            for (String word : words) {
                String e = escapeLike(word);
                List<Predicate> anyField = new ArrayList<>();
                for (String field : SEARCH_FIELDS) {
                    Expression<String> f = cb.lower(root.<String>get(field));
                    if (word.length() < 3) {
                        anyField.add(cb.like(f, e + "%", ESC));        // field starts with it
                        anyField.add(cb.like(f, "% " + e + "%", ESC)); // a later word starts with it
                        anyField.add(cb.like(f, "%," + e + "%", ESC)); // a later item in the skills list
                    } else {
                        anyField.add(cb.like(f, "%" + e + "%", ESC));
                    }
                }
                p.add(cb.or(anyField.toArray(new Predicate[0])));
            }

            if (!category.isEmpty()) p.add(cb.equal(root.get("category"), category));
            if (!city.isEmpty()) p.add(cb.equal(root.get("city"), city));
            if (!skill.isEmpty()) {
                // skills are stored as "a,b,c"; wrapping in commas lets us match a whole skill only
                p.add(cb.like(
                        cb.lower(cb.concat(cb.concat(",", root.<String>get("skills")), ",")),
                        "%," + escapeLike(skill.toLowerCase(Locale.ROOT)) + ",%", ESC));
            }
            if (type != null) p.add(cb.equal(root.get("type"), type));
            if (mode != null) p.add(cb.equal(root.get("mode"), mode));

            // The same specification also builds the COUNT query, which must not have an ORDER BY
            boolean isCountQuery = Long.class.equals(query.getResultType()) || long.class.equals(query.getResultType());
            if (byRelevance && !words.isEmpty() && !isCountQuery) {
                query.orderBy(cb.asc(relevanceScore(root, cb, words.get(0))),
                        cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
            }

            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    /** 0 = title starts with the word ... 5 = found only in the description. Lower is better. */
    private Expression<Integer> relevanceScore(Root<Course> root, CriteriaBuilder cb, String word) {
        String e = escapeLike(word);
        Expression<String> title = cb.lower(root.<String>get("title"));
        Expression<String> provider = cb.lower(root.<String>get("providerName"));
        Expression<String> skills = cb.lower(root.<String>get("skills"));
        Expression<String> category = cb.lower(root.<String>get("category"));

        CriteriaBuilder.Case<Integer> score = cb.selectCase();
        score.when(cb.like(title, e + "%", ESC), 0)
             .when(cb.like(title, "% " + e + "%", ESC), 1)
             .when(cb.like(title, "%" + e + "%", ESC), 2)
             .when(cb.like(skills, "%" + e + "%", ESC), 3)
             .when(cb.like(category, "%" + e + "%", ESC), 3)
             .when(cb.like(provider, "%" + e + "%", ESC), 4);
        return score.otherwise(5);
    }

    private static String escapeLike(String s) {
        return s.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
