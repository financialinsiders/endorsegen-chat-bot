import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
enum APIEndPointUrls {
  ipEndPoint = 'https://ipgeolocation.abstractapi.com/v1',
}
@Injectable({
  providedIn: 'root'
})
export class IpService {

  constructor(private http: HttpClient,) { }
  getIpDetails() {
    let params = new HttpParams();
    params = params.append('api_key', 'f4e4855f52b343bf8f2a29ac9ddcfe81');
    return this.http.get(APIEndPointUrls.ipEndPoint, { params: params });
  }
}
