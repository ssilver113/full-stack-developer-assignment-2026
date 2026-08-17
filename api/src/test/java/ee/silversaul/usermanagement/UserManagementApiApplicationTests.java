package ee.silversaul.usermanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test: fails if the Spring context cannot start, which catches broken
 * configuration, missing beans, failed Flyway migrations and — because
 * {@code ddl-auto} is {@code validate} — any drift between the entity mapping and
 * the migrated schema.
 */
@SpringBootTest
@ActiveProfiles("test")
class UserManagementApiApplicationTests {

    @Test
    void contextLoads() {
    }

}
