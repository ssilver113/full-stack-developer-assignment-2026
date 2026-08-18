package ee.silversaul.usermanagement.user;

import java.util.List;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void createReturnsCreatedWithLocationAndBody() throws Exception {
        given(userService.create(any()))
                .willReturn(new UserResponse(1L, "Silver", "Saul", "silver.saul@example.com"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Silver",
                                  "lastName": "Saul",
                                  "email": "silver.saul@example.com"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/users/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("silver.saul@example.com"));
    }

    @Test
    void createRejectsMalformedEmailWithFieldMessage() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Silver",
                                  "lastName": "Saul",
                                  "email": "not-an-email"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email").value("Email must be a valid address"));

        // Invalid input must be rejected at the edge, never reaching the service.
        then(userService).shouldHaveNoInteractions();
    }

    @Test
    void createRejectsMissingFieldsWithOneMessagePerField() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "",
                                  "lastName": "",
                                  "email": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").value("First name is required"))
                .andExpect(jsonPath("$.errors.lastName").value("Last name is required"))
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    void findAllReturnsUsersFromService() throws Exception {
        given(userService.findAll()).willReturn(List.of(
                new UserResponse(1L, "Silver", "Saul", "silver.saul@example.com"),
                new UserResponse(2L, "Anna", "Tamm", "anna.tamm@example.com")));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].firstName").value("Anna"));
    }

    @Test
    void updateReturnsNotFoundForUnknownId() throws Exception {
        willThrow(new UserNotFoundException(999L))
                .given(userService).update(eq(999L), any());

        mockMvc.perform(put("/api/users/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Ghost",
                                  "lastName": "User",
                                  "email": "ghost@example.com"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("User not found"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateReturnsConflictForDuplicateEmail() throws Exception {
        willThrow(new EmailAlreadyRegisteredException("anna.tamm@example.com"))
                .given(userService).update(eq(1L), any());

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Silver",
                                  "lastName": "Saul",
                                  "email": "anna.tamm@example.com"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Email already registered"));
    }

}
