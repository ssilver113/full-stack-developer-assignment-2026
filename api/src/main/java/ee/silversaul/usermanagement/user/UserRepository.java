package ee.silversaul.usermanagement.user;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Persistence access for {@link User}. Spring Data supplies the CRUD operations;
 * derived query methods are added here as the service layer needs them.
 */
public interface UserRepository extends JpaRepository<User, Long> {
}
