package ee.silversaul.usermanagement.user;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    // No test-level @Transactional: each test commits, so assertions read what the
    // database holds rather than pending state.
    @BeforeEach
    void clearDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void createPersistsUserAndAssignsId() {
        UserResponse created = userService.create(
                new UserRequest("Silver", "Saul", "silver.saul@example.com"));

        assertThat(created.id()).isNotNull();
        assertThat(userRepository.findById(created.id())).hasValueSatisfying(stored -> {
            assertThat(stored.getFirstName()).isEqualTo("Silver");
            assertThat(stored.getLastName()).isEqualTo("Saul");
            assertThat(stored.getEmail()).isEqualTo("silver.saul@example.com");
        });
    }

    @Test
    void createStoresEmailInLowerCase() {
        UserResponse created = userService.create(
                new UserRequest("Anna", "Tamm", "  Anna.Tamm@Example.COM  "));

        assertThat(created.email()).isEqualTo("anna.tamm@example.com");
    }

    @Test
    void findAllReturnsEveryStoredUser() {
        userService.create(new UserRequest("Silver", "Saul", "silver.saul@example.com"));
        userService.create(new UserRequest("Anna", "Tamm", "anna.tamm@example.com"));

        List<UserResponse> users = userService.findAll();

        assertThat(users)
                .extracting(UserResponse::email)
                .containsExactlyInAnyOrder("silver.saul@example.com", "anna.tamm@example.com");
    }

    @Test
    void updateChangesStoredDetails() {
        Long id = userService.create(
                new UserRequest("Silver", "Saul", "silver.saul@example.com")).id();

        userService.update(id, new UserRequest("Silver", "Saul-Updated", "new.address@example.com"));

        assertThat(userRepository.findById(id)).hasValueSatisfying(stored -> {
            assertThat(stored.getLastName()).isEqualTo("Saul-Updated");
            assertThat(stored.getEmail()).isEqualTo("new.address@example.com");
        });
    }

    @Test
    void createRejectsDuplicateEmailRegardlessOfCase() {
        userService.create(new UserRequest("Anna", "Tamm", "anna.tamm@example.com"));

        assertThatThrownBy(() -> userService.create(
                new UserRequest("Impostor", "User", "ANNA.TAMM@EXAMPLE.COM")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        assertThat(userRepository.findAll()).hasSize(1);
    }

    @Test
    void updateAllowsUserToKeepOwnEmail() {
        Long id = userService.create(
                new UserRequest("Anna", "Tamm", "anna.tamm@example.com")).id();

        UserResponse updated = userService.update(id,
                new UserRequest("Anna", "Tamm-Married", "anna.tamm@example.com"));

        assertThat(updated.lastName()).isEqualTo("Tamm-Married");
    }

    @Test
    void updateRejectsEmailHeldByAnotherUser() {
        userService.create(new UserRequest("Anna", "Tamm", "anna.tamm@example.com"));
        Long id = userService.create(
                new UserRequest("Silver", "Saul", "silver.saul@example.com")).id();

        assertThatThrownBy(() -> userService.update(id,
                new UserRequest("Silver", "Saul", "anna.tamm@example.com")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
    }

    @Test
    void updateRejectsUnknownId() {
        assertThatThrownBy(() -> userService.update(999L,
                new UserRequest("Ghost", "User", "ghost@example.com")))
                .isInstanceOf(UserNotFoundException.class);
    }

}
