package ee.silversaul.usermanagement.user;

/**
 * Thrown when an email address is already held by another user. Translated to
 * {@code 409 Conflict} by the global exception handler.
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("Email address is already registered: " + email);
    }

}
