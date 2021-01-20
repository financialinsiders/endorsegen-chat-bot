import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { CryptoStorageService } from '../services/crypto-storage.service';

enum APIEndPointUrls {
  adminAjax = 'https://financialinsiders.ca/wp-admin/admin-ajax.php',
  getFbId = 'ic_get_fb_id',
  retrieveChatBot = 'ic_retrieve_chat_bot',
  getAgentProfile = 'ic_get_agent_profile',
}
@Injectable()
export class AdminService {
  constructor(private http: HttpClient, private cryptoService: CryptoStorageService) { }

  getFbId(userId) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.getFbId);
    params = params.append('user_id', userId);
    return this.http.get(APIEndPointUrls.adminAjax, { params: params });
  }

  retrieveChatBot(chat, agentID) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.retrieveChatBot);
    params = params.append('chat', chat);
    params = params.append('agentID', agentID);
    return this.http.get(APIEndPointUrls.adminAjax, { params: params });
  }
  getAgentProfile(userId) {
    let params = new HttpParams();
    params = params.append('action', APIEndPointUrls.getAgentProfile);
    params = params.append('agent_id', userId);
    return this.http.get(APIEndPointUrls.adminAjax, { params: params });
  }
}
