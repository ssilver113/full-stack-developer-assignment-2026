package ee.silversaul.usermanagement.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Messages are spelled out because they are returned to callers, and length
 * limits mirror {@code V1__create_users.sql} so oversized input fails validation
 * rather than the database.
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
