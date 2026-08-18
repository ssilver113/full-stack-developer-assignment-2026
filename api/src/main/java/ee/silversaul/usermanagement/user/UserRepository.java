package ee.silversaul.usermanagement.user;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    // For updates: an address already held by the user being edited is not a
    // conflict, so that user is excluded.
    boolean existsByEmailAndIdNot(String email, Long id);

}
