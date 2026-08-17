package ee.silversaul.usermanagement.user;

/**
 * Thrown when an operation targets a user id that does not exist. Translated to
 * {@code 404 Not Found} by the global exception handler.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("No user exists with id " + id);
    }

}
