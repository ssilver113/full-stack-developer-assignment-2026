package ee.silversaul.usermanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test: fails if the Spring context cannot start, which catches broken
 * configuration, missing beans and failed Flyway migrations before any of the
 * behavioural tests run.
 */
@SpringBootTest
class UserManagementApiApplicationTests {

    @Test
    void contextLoads() {
    }

}
