package ee.silversaul.usermanagement.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A registered user.
 *
 * <p>Bean Validation annotations deliberately live on the request DTO rather than
 * here: this class describes what the database stores, while the DTO describes
 * what callers are allowed to send. Keeping them apart means the wire contract
 * can change without a migration, and vice versa.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 320, unique = true)
    private String email;

    /**
     * Required by JPA, which instantiates entities reflectively. Not part of the
     * public API of this class, hence {@code protected}.
     */
    protected User() {
    }

    public User(String firstName, String lastName, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    /**
     * Applies an edit as a single operation. Exposing one intent-named method
     * rather than a setter per field keeps the valid states of this entity in one
     * place, so a caller cannot leave it half-updated.
     */
    public void updateDetails(String firstName, String lastName, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

}
