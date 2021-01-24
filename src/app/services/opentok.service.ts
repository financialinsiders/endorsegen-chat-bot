import { Injectable } from '@angular/core';

import * as OT from '@opentok/client';
import { environment } from 'environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class OpentokService {

  session: OT.Session;

  constructor() { }

  getOT() {
    return OT;
  }

  initSession(sessionId) {
      this.session = this.getOT().initSession(environment.openTokApiKey, sessionId);
      return Promise.resolve(this.session);
  }

  connect(token) {
    return new Promise((resolve, reject) => {
      this.session.connect(token, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.session);
        }
      });
    });
  }
}
