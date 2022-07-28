import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase';

enum APIEndPointUrls {
  meetingEndPoint = 'https://prod-node-api.herokuapp.com/v1/',
  localPoint = 'http://localhost:9090/v1/',
  createPayment = 'payment/create-payment',
  createPaymentIntent = 'payment/create-payment-intent',
  activityLog = 'activity/logger',
}
@Injectable({
  providedIn: 'root'
})
export class PointsService {

  constructor(private http: HttpClient, private db: AngularFirestore) { }
  logEndorserInviteActivity(points, activityObject, endorserId) {
    var headers = new HttpHeaders(
      { 'Content-Type': 'application/json' }
    );
    this.updateEndorserPoints(points, activityObject.title, endorserId);
    return this.http.post(APIEndPointUrls.localPoint + APIEndPointUrls.activityLog, activityObject, { headers: headers });
  }
  logIpAddress(endorserInvitationId, ipAddress) {
    this.db.collection('endorser-invitations').doc(endorserInvitationId).update(
      {
        videoClaimedIpAddress: firebase.firestore.FieldValue.arrayUnion(ipAddress),
      }
    )
  }
  updateEndorserPoints(point, pointTitle, endorserId) {
    var transactionData = {
      points: point,
      timeStamp: new Date().getTime(),
      transactionTitle: pointTitle
    }
    this.db.collection('endorsers').doc(endorserId).update(
      {
        transactionHistory: firebase.firestore.FieldValue.arrayUnion(transactionData),
        totalPoints: firebase.firestore.FieldValue.increment(point)
      }
    )
  }
}
