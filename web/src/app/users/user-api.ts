import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { User, UserDraft } from './user';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  create(draft: UserDraft): Observable<User> {
    return this.http.post<User>(this.baseUrl, draft);
  }

  update(id: number, draft: UserDraft): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, draft);
  }
}
