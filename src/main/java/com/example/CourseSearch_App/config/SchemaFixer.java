package com.example.CourseSearch_App.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate's "update" mode adds new tables and columns but never widens an existing column.
 * If provider_logos was created earlier with a small BLOB column (64 KB), most logos would fail to save,
 * so the column is widened once here. Safe to run on every start.
 */
@Component
public class SchemaFixer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixer.class);
    private final JdbcTemplate jdbc;

    public SchemaFixer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE provider_logos MODIFY data LONGBLOB NOT NULL");
        } catch (Exception e) {
            log.warn("Could not widen provider_logos.data (fine if the table is new): {}", e.getMessage());
        }
    }
}
