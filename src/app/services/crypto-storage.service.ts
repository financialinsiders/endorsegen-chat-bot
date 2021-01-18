import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoStorageService {
  public encryptSecretKey: string = 'secret_key';
  constructor() { }

  setItem(key, data) {
    localStorage.setItem(key, CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptSecretKey).toString());
  }
  getItem(key) {
    var data = localStorage.getItem(key);
    if (data) {
      const bytes = CryptoJS.AES.decrypt(data, this.encryptSecretKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
    return undefined;
  }
  removeItem(key) {
    localStorage.removeItem(key);
  }
}
