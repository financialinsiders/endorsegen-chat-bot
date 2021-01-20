import { Injectable } from '@angular/core';
import { CryptoStorageService } from './crypto-storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private cryptoService: CryptoStorageService) { }

  setUserSession(id) {
    this.cryptoService.setItem('fi-chat-bot.initialized', id);
  }
  getUserSession() {
    return this.cryptoService.getItem('fi-chat-bot.initialized');
  }
}
