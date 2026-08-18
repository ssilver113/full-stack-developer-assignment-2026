export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Mirrors the API's UserRequest, where the server owns the id.
export type UserDraft = Omit<User, 'id'>;
