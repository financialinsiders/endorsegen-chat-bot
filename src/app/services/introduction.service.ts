import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
enum APIEndPointUrls {
  adminAjax = 'https://financialinsiders.ca/wp-admin/admin-ajax.php',
  adminUserAjax = 'https://financialinsiders.ca/terryt/wp-admin/admin-ajax.php',
  createIntroduction = 'ic_create_introduction',
  createIntroductionSession = 'ic_create_introduction_session',
  retreiveBotEmailTemplate = 'ic_retreive_bot_email_template',
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
  createIntroductionSession(data) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.createIntroductionSession);
    return this.http.post(APIEndPointUrls.adminAjax, data, { headers: this.headers, params: params });
  }
  retreiveBotEmailTemplate(botId) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.retreiveBotEmailTemplate);
    return this.http.post(APIEndPointUrls.adminUserAjax, botId, { headers: this.headers, params: params });
  }
}
