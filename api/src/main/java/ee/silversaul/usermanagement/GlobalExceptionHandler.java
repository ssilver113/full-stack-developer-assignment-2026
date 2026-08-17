package ee.silversaul.usermanagement;

import java.util.LinkedHashMap;
import java.util.Map;

import ee.silversaul.usermanagement.user.EmailAlreadyRegisteredException;
import ee.silversaul.usermanagement.user.UserNotFoundException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates failures into RFC 7807 problem responses, so every error leaves the
 * application in one recognisable shape instead of each controller inventing its
 * own.
 *
 * <p>Lives in the root package rather than the {@code user} feature package
 * because it is not specific to users; it applies to whatever features are added
 * later.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bean Validation failures. Field errors are returned as a map so a client can
     * attach each message to the input that caused it, rather than parsing prose.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationFailure(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            // Several constraints can fail on one field; keep them all rather than
            // letting the last one silently win.
            errors.merge(fieldError.getField(), fieldError.getDefaultMessage(),
                    (existing, additional) -> existing + "; " + additional);
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "One or more fields are invalid.");
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleUserNotFound(UserNotFoundException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, exception.getMessage());
        problem.setTitle("User not found");
        return problem;
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ProblemDetail handleEmailAlreadyRegistered(EmailAlreadyRegisteredException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, exception.getMessage());
        problem.setTitle("Email already registered");
        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "The request conflicts with data that already exists.");
        problem.setTitle("Conflict");
        return problem;
    }

}
