package ee.silversaul.usermanagement.user;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Persistence access for {@link User}. Spring Data supplies the CRUD operations;
 * derived query methods are added here as the service layer needs them.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Used before an insert to report a duplicate as a clear conflict rather than
     * letting the unique constraint surface as an opaque database error.
     */
    boolean existsByEmail(String email);

    /**
     * The update equivalent: an address already held by the user being edited is
     * not a conflict, so that user is excluded from the check.
     */
    boolean existsByEmailAndIdNot(String email, Long id);

}
