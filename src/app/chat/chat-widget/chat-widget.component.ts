import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core'
import { AdminService } from '../../services/admin-service'
import { Subject } from 'rxjs'
import { fadeIn, fadeInOut } from '../animations'
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { FirebaseService } from 'app/services/firebase.service';
import { UserService } from 'app/services/user.service';

const rand = max => Math.floor(Math.random() * max)

@Component({
  selector: 'chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  animations: [fadeInOut, fadeIn],
})
export class ChatWidgetComponent implements OnInit {
  @ViewChild('bottom') bottom: ElementRef
  @Input() public theme: 'blue' | 'grey' | 'red' = 'blue';
  @Input() public botId;
  @Input() public instanceId;
  public _visible = false
  public firebaseId: any
  public chatElements: any
  public currentIndex: number = 0;
  public cSessionId: string;
  clientFirebaseId: string;
  existUserSession: any;
  agentLive: boolean;
  agentName: any;
  public get visible() {
    return this._visible
  }

  @Input() public set visible(visible) {
    this._visible = visible
    if (this._visible) {
      setTimeout(() => {
        this.scrollToBottom()
        this.focusMessage()
      }, 0)
    }
  }

  public focus = new Subject()

  public operator = {
    name: 'Operator',
    status: 'online',
    avatar: `https://randomuser.me/api/portraits/women/${rand(100)}.jpg`,
  }

  public client = {
    name: 'Guest User',
    status: 'online',
    avatar: `https://randomuser.me/api/portraits/men/${rand(100)}.jpg`,
  }

  public messages = []

  constructor(private adminService: AdminService, private angularFireDatabase: AngularFireDatabase, private firebaseService: FirebaseService, private userService: UserService) { }
  public addMessage(from, element, type: 'received' | 'sent') {
    this.messages.unshift({
      from,
      element,
      type,
      date: new Date().getTime(),
    })
    this.scrollToBottom()
  }

  public scrollToBottom() {
    if (this.bottom !== undefined) {
      this.bottom.nativeElement.scrollIntoView()
    }
  }

  public focusMessage() {
    this.focus.next(true);
  }

  ngOnInit() {
    this.existUserSession = this.userService.getUserSession();
    this.adminService.getAgentProfile(this.instanceId).subscribe(data => {
      this.operator.name = data['first_name'] + ' ' +data['last_name'];
    })
    if (this.existUserSession) {
      this.clientFirebaseId = this.existUserSession.clientFirebaseId;
      this.cSessionId = this.existUserSession.cSessionId
      this.angularFireDatabase.object(`notify-users/${this.instanceId}`).update({
        type: 'lead-user',
        newNotification: true
      });
      
      
      this.adminService.getFbId(this.instanceId).subscribe(data => {
        this.firebaseId = data['firebase_id'];
        this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
          this.operator.status = data['onlineStatus'] ? 'online' : '';
        });
        this.adminService.retrieveChatBot(this.botId, this.instanceId).subscribe(data => {

          this.chatElements = data['data']['elements'];
          this.angularFireDatabase.list(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).query.once("value").then(data => {
            var chatBackUp = JSON.parse(data.val());
            this.messages = chatBackUp.message;
            this.currentIndex = chatBackUp.position;
            console.log(this.currentIndex);
          });

          this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {

          });
          this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
            var messageHistory = Object.values(data);
            var lastMessage = messageHistory[messageHistory.length - 1];
            console.log(lastMessage.senderId, this.firebaseId);
            if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
              this.agentLive = true;
              this.currentIndex = 999;
              this.addMessage(this.operator, { clabel: lastMessage.message, live: true }, 'received');
            }
          });
        });

      });
    } else {
      this.angularFireDatabase.object(`notify-users/${this.instanceId}`).update({
        type: 'new-user',
        newNotification: true
      });
      this.adminService.getFbId(this.instanceId).subscribe(data => {
        this.firebaseId = data['firebase_id'];
        this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
          this.operator.status = data['onlineStatus'] ? 'online' : '';
        });
        this.adminService.retrieveChatBot(this.botId, this.instanceId).subscribe(data => {

          this.chatElements = data['data']['elements'];
          var userInfo = {
            connectedAgentId: this.instanceId,
            username: 'New User'
          }
          this.angularFireDatabase.database.ref('users/').push(userInfo).then((userData) => {
            this.clientFirebaseId = userData.key;

            var sessionInfo = {
              username: 'Anonymous',
              user_attempt: false,
              timestamp: new Date().getTime(),
              bot_id: this.botId,
              user_id: this.clientFirebaseId,
              bot_title: 'vm.botInfo.title',
              page_link: window.top.location.href,
              status: 'OPEN',
              //meeting_id: $rootScope.fiApp.meetingId,
              bot_type: 'vm.botInfo.chat_type',
              isNewMsg: true
            };
            this.angularFireDatabase.database.ref(`sessions/${this.firebaseId}`).push(sessionInfo).then((data) => {

              this.cSessionId = data.key;
              this.userService.setUserSession({
                clientFirebaseId: this.clientFirebaseId,
                cSessionId: this.cSessionId
              });
              this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {

              });
              this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[0], this.chatElements[0].clabel, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
              this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                var messageHistory = Object.values(data);
                var lastMessage = messageHistory[messageHistory.length - 1];
                if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                  this.agentLive = true;
                  this.currentIndex = 999;
                  this.addMessage(this.operator, { clabel: lastMessage.message, live: true }, 'received');
                }
              });
            });
          });
          setTimeout(() => {
            this.addMessage(this.operator, this.chatElements[0], 'received');
            this.currentIndex += 1;
          }, 1500);
        });

      });
    }


  }
  public toggleChat() {
    this.visible = !this.visible
  }
  public removeHTML(text) {
    return text.replace(/<\/?[^>]+(>|$)/g, "");
  }
  public sendMessage({ message }) {
    if (message.trim() === '') {
      return
    }
    var senderMessage = {
      chatId: this.clientFirebaseId,
      message: message,
      conversationId: this.firebaseId,
      senderId: this.clientFirebaseId,
      status: 'CONV_OPEN',
      timestamp: 1610987426109
    }
    this.angularFireDatabase.database.ref(`messages/${this.firebaseId}/${this.cSessionId}`).push(senderMessage);
    this.addMessage(this.client, { clabel: message }, 'sent');
    setTimeout(() => this.proceedNext(), 1000)
  }
  public proceedNext() {
    console.log(this.currentIndex);
    if(this.currentIndex !== 999) {
      this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.currentIndex], this.chatElements[this.currentIndex].clabel, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.currentIndex], 'received');
      this.currentIndex += 1;
    }
    this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ position: this.agentLive ? 999  : this.currentIndex, message: this.messages }));

  }
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === '/') {
      this.focusMessage()
    }
    if (event.key === '?' && !this._visible) {
      this.toggleChat()
    }
  }

}
