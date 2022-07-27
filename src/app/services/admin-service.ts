import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { CryptoStorageService } from '../services/crypto-storage.service';

enum APIEndPointUrls {
  adminAjax = 'https://financialinsiders.ca/wp-admin/admin-ajax.php',
  getAgentProfile = 'ic_get_agent_profile',
  getElementID = 'http://localhost:9090/v1/cronofy/getElementID',
  emailSendTemplate = 'http://localhost:9090/v1/email/sendTemplate',
  getAvailableSlots = 'http://localhost:9090/v1/calendar/getAvailableSlots/',
  appointmentMeeting = 'ic_appointment_meeting',
  bookSlot = 'http://localhost:9090/v1/calendar/bookSlot',
  newLead = 'ic_new_lead_nomail',
  endorserProfile = 'ic_endorser_profile',
}
// locahost should be update with api.agentonline.io
@Injectable()
export class AdminService {
  constructor(private http: HttpClient) { }

  getElementID(agentID) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/json' }
    );
    var data = {
      "agentID": agentID,
      "origin": window.location.origin
    };
    return this.http.post(APIEndPointUrls.getElementID, data, { headers: headers });
  }
  getAvailableSlots(agentID) {
    return this.http.get(APIEndPointUrls.getAvailableSlots + agentID);
  }
  createAppointmentMeeting(data) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.appointmentMeeting);

    return this.http.post(APIEndPointUrls.adminAjax, data, { headers: headers, params: params });
  }
  bookSlot(data) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/json' }
    );
    return this.http.post(APIEndPointUrls.bookSlot, data, { headers: headers });
  }
  newLead(data) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.newLead);

    return this.http.post(APIEndPointUrls.adminAjax, data, { headers: headers, params: params });
  }
  sendEmailNotificationWithTemplate(data) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/json' }
    );
    return this.http.post(APIEndPointUrls.emailSendTemplate, data, { headers: headers });
}
}