package ee.silversaul.usermanagement.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Incoming payload for creating or updating a user.
 *
 * <p>The messages are spelled out rather than left to Bean Validation's defaults,
 * because they are returned to callers and "must not be blank" is not a useful
 * thing to show a person. Length limits mirror the columns in
 * {@code V1__create_users.sql}, so oversized input is rejected as a validation
 * error rather than failing at the database.
 */
public record UserRequest(

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must be at most 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must be at most 100 characters")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid address")
        @Size(max = 320, message = "Email must be at most 320 characters")
        String email

) {
}
