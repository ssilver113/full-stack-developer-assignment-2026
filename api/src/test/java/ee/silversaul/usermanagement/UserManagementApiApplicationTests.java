package ee.silversaul.usermanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Catches broken configuration, failed migrations and, because {@code ddl-auto}
 * is {@code validate}, drift between the entity mapping and the schema.
 */
@SpringBootTest
@ActiveProfiles("test")
class UserManagementApiApplicationTests {

    @Test
    void contextLoads() {
    }

}
