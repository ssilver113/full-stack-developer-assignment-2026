package ee.silversaul.usermanagement.user;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Returns {@link UserResponse} rather than the entity, so the transaction
 * boundary and the persistence model stay behind this class.
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
        // No save call: `user` is managed within this transaction, so JPA flushes
        // the change on commit.
        return UserResponse.from(user);
    }

    // Lower-cased so Bob@x.com and bob@x.com are one mailbox. Locale.ROOT because
    // the default locale lower-cases "I" to a dotless i (U+0131) in Turkish.
    private static String normaliseEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

}
