package ee.silversaul.usermanagement.user;

/**
 * Outgoing representation of a user. Separate from {@link User} so the wire
 * contract does not shift whenever the persistence model does.
 */
public record UserResponse(Long id, String firstName, String lastName, String email) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }

}
