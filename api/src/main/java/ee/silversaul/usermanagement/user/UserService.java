package ee.silversaul.usermanagement.user;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application logic for user management. Returns {@link UserResponse} rather than
 * the entity, so the transaction boundary and the persistence model both stay
 * behind this class and the controller can remain a thin HTTP adapter.
 */
@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    public List<UserResponse> findAll() {
        return users.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        String email = normaliseEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException(email);
        }
        User user = new User(request.firstName(), request.lastName(), email);
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = users.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        String email = normaliseEmail(request.email());
        if (users.existsByEmailAndIdNot(email, id)) {
            throw new EmailAlreadyRegisteredException(email);
        }

        user.updateDetails(request.firstName(), request.lastName(), email);
        // No explicit save call: `user` is managed within this transaction, so JPA
        // detects the change and flushes it on commit.
        return UserResponse.from(user);
    }

    private static String normaliseEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

}
