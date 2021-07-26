import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
enum APIEndPointUrls {
  adminAjax = 'https://financialinsiders.ca/wp-admin/admin-ajax.php',
  createIntroduction = 'ic_create_introduction',
}

@Injectable({
  providedIn: 'root'
})
export class IntroductionService {
  public headers = new HttpHeaders(
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  constructor(private http: HttpClient) { }

  createIntroduction(data) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.createIntroduction);
    return this.http.post(APIEndPointUrls.adminAjax, data, { headers: this.headers, params: params });
  }
}
