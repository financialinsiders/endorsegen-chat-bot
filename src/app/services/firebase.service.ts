import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private angularFireDatabase: AngularFireDatabase) { }
  sendMessage(clientFirebaseId, chatElements, message, firebaseId, status, timestamp, type, cSessionId) {
    var messageEntity = {
      chatId: clientFirebaseId,
      metadata: chatElements,
      message: message,
      conversationId: firebaseId,
      senderId: firebaseId,
      status: status,
      timestamp: timestamp,
      type: type,
      sessionId: cSessionId
    }
    this.angularFireDatabase.database.ref(`messages/${firebaseId}/${cSessionId}`).push(messageEntity);
    this.angularFireDatabase.database.ref(`sessions/${firebaseId}/${cSessionId}`).update({
      lastMessage: message,
      lastMessageType: status,
      isNewMsg: true,
      isNewUser: false,
      timestamp: new Date().getTime()
    });
  }
}
