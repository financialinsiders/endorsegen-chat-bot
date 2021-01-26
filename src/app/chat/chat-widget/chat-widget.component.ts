import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core'
import { AdminService } from '../../services/admin-service'
import { Subject } from 'rxjs'
import { fadeIn, fadeInOut } from '../animations'
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { FirebaseService } from 'app/services/firebase.service';
import { UserService } from 'app/services/user.service';
import { OpentokService } from 'app/services/opentok.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CryptoStorageService } from 'app/services/crypto-storage.service';

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
  historyMode: boolean;
  sessionHistoryChatList: any = [];
  sessionId: any;
  token: any;
  session: OT.Session;
  streams: Array<OT.Stream> = [];
  isPublished: boolean;
  email: any = this.cryptoService.getItem('email');
  name: any = this.cryptoService.getItem('name');
  leadId: any = this.cryptoService.getItem('lead.id');
  phone: any = this.cryptoService.getItem('phone');
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
    avatar: `https://fiapps.s3.ca-central-1.amazonaws.com/assets/bot.png`,
  }

  public client = {
    name: 'Guest User',
    status: 'online',
    avatar: `https://fiapps.s3.ca-central-1.amazonaws.com/assets/client.png`,
  }

  public messages = []

  constructor(private changeDetectorRef: ChangeDetectorRef, private adminService: AdminService, private angularFireDatabase: AngularFireDatabase, private firebaseService: FirebaseService, private userService: UserService, private opentokService: OpentokService, private sanitizer: DomSanitizer, private cryptoService: CryptoStorageService) { }
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
      this.operator.name = data['first_name'] + ' ' + data['last_name'];
    });
    if (this.existUserSession && (this.existUserSession.botId === this.botId || this.existUserSession.botId !== this.botId && this.existUserSession.chatStatus)) {
      this.botId = this.existUserSession.botId;
      this.visible = this.existUserSession.chatStatus;
      this.clientFirebaseId = this.existUserSession.clientFirebaseId;
      this.cSessionId = this.existUserSession.cSessionId
      this.initializeSession(this.clientFirebaseId);
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
          this.angularFireDatabase.list(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}`).query.once("value").then(data => {
            var sessionMessage = data.val();
            var chatBackUp = JSON.parse(sessionMessage[this.cSessionId]);
            this.messages = chatBackUp['message'];
            this.currentIndex = chatBackUp['position'];
            //this.addMessage(this.operator, { clabel: 'Welcome back !!!', live: true }, 'received');
            for (let [key, value] of Object.entries(sessionMessage)) {
              var eachMessage = JSON.parse(value.toString());
              eachMessage['key'] = key;
              this.sessionHistoryChatList.push(eachMessage);
            };
          });

          this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {

          });
          this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
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
    } else if (this.existUserSession && this.existUserSession.botId !== this.botId && !this.existUserSession.chatStatus) {
      this.adminService.getFbId(this.instanceId).subscribe(data => {
        this.firebaseId = data['firebase_id'];
        this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
          this.operator.status = data['onlineStatus'] ? 'online' : '';
        });
        this.adminService.retrieveChatBot(this.botId, this.instanceId).subscribe(data => {

          this.chatElements = data['data']['elements'];
          this.clientFirebaseId = this.existUserSession.clientFirebaseId;
          this.initializeSession(this.clientFirebaseId);
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
              cSessionId: this.cSessionId,
              botId: this.botId,
              chatStatus: false
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
          setTimeout(() => {
            this.addMessage(this.operator, this.chatElements[0], 'received');
            this.currentIndex += 1;
            this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? 999 : this.currentIndex, message: this.messages }));
          }, 1500);
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
            this.initializeSession(this.clientFirebaseId);
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
                cSessionId: this.cSessionId,
                botId: this.botId,
                chatStatus: false
              });
              this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {

              });
              this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[0], this.chatElements[0].clabel, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
              this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                if (data) {
                  var messageHistory = Object.values(data);
                  var lastMessage = messageHistory[messageHistory.length - 1];
                  if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                    this.agentLive = true;
                    this.currentIndex = 999;
                    this.addMessage(this.operator, { clabel: lastMessage.message, live: true }, 'received');
                  }
                }

              });
            });
          });
          setTimeout(() => {
            this.addMessage(this.operator, this.chatElements[0], 'received');
            this.currentIndex += 1;
            this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? 999 : this.currentIndex, message: this.messages }));
          }, 1500);
        });

      });
    }


  }
  public toggleChat() {
    this.visible = !this.visible
    this.userService.setUserSession({
      clientFirebaseId: this.clientFirebaseId,
      cSessionId: this.cSessionId,
      botId: this.botId,
      chatStatus: this.visible
    });
  }
  public historyChat() {
    this.historyMode = !this.historyMode;
  }
  public removeHTML(text) {
    return text.replace(/<\/?[^>]+(>|$)/g, "");
  }
  getSafeUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }
  public sendMessage({ message }) {
    if (message.trim() === '') {
      return
    }
    var elementType = this.messages[0].element.type;
    if (elementType === 'name') {
      this.name = message;
      this.cryptoService.setItem('name', this.name);
      this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
        username: message,
      });
      if(this.leadId) this.createLead();
    } else if (elementType === 'email') {
      this.email = message;
      this.cryptoService.setItem('email', this.email);
      this.createLead();
      this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
        email: message,
      });
    } else if (elementType === 'phone') {
      this.phone = message;
      this.cryptoService.setItem('phone', this.phone);
      this.createLead();
      this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
        phone: message,
      });
    };
    var senderMessage = {
      chatId: this.clientFirebaseId,
      message: message,
      conversationId: this.firebaseId,
      senderId: this.clientFirebaseId,
      status: 'CONV_OPEN',
      timestamp: new Date().getTime()
    }
    this.angularFireDatabase.database.ref(`messages/${this.firebaseId}/${this.cSessionId}`).push(senderMessage);
    this.addMessage(this.client, { clabel: message }, 'sent');
    setTimeout(() => this.proceedNext(), 1000)
  }
  public createLead() {
    var requestData = {
      "first_name": this.name,
      "email": this.email,
      "phone": this.phone,
      "agent_id": this.instanceId,
      "endorser_id": this.instanceId,
      "fb_ref": this.firebaseId
    }
    this.adminService.newLead(requestData).subscribe(data => {
      this.leadId = data['id'];
      this.cryptoService.setItem('lead.id', this.leadId);
    });
  }
  public proceedNext() {
    if (this.currentIndex !== 999) {
      this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.currentIndex], this.chatElements[this.currentIndex].clabel, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.currentIndex], 'received');
      this.currentIndex += 1;
    }
    this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? 999 : this.currentIndex, message: this.messages }));

  }
  public selectMessage(message) {
    this.cSessionId = message['key'];
    this.messages = message['message'];
    this.currentIndex = message['position'];
    this.historyMode = !this.historyMode;
    this.userService.setUserSession({
      clientFirebaseId: this.clientFirebaseId,
      cSessionId: this.cSessionId,
      botId: this.botId,
      chatStatus: true
    });
    if (this.botId !== message['botId']) {
      this.adminService.retrieveChatBot(message['botId'], this.instanceId).subscribe(data => {
        this.chatElements = data['data']['elements'];
      });
    }
  }
  public multiChoiceSelect(choice) {
    var senderMessage = {
      chatId: this.clientFirebaseId,
      message: choice.option,
      conversationId: this.firebaseId,
      senderId: this.clientFirebaseId,
      status: 'CONV_OPEN',
      timestamp: new Date().getTime()
    }
    this.messages[0].hide = true;
    this.angularFireDatabase.database.ref(`messages/${this.firebaseId}/${this.cSessionId}`).push(senderMessage);
    this.addMessage(this.client, { clabel: choice.option }, 'sent');
    let tempIndex = this.currentIndex
    this.chatElements.splice.apply(this.chatElements, [this.currentIndex, 0].concat(choice.logic_jump));
    setTimeout(() => this.proceedNext(), 1000)
  }
  public initializeSession(clientFirebaseId) {
    this.angularFireDatabase.object(`users/${clientFirebaseId}`).valueChanges().subscribe(data => {

      if (data && data['otSessionId'] && data['token']) {
        this.sessionId = data['otSessionId'];
        this.token = data['token'];
        this.opentokService.initSession(this.sessionId).then((session: OT.Session) => {
          this.session = session;
          this.session.on('streamCreated', (event) => {
            this.streams.push(event.stream);
            this.changeDetectorRef.detectChanges();
          });
          this.session.on('streamDestroyed', (event) => {
            const idx = this.streams.indexOf(event.stream);
            if (idx > -1) {
              this.streams.splice(idx, 1);
              this.changeDetectorRef.detectChanges();
            }
          });
        })
          .then(() => this.opentokService.connect(this.token))
          .catch((err) => {
            console.error(err);
            alert('Unable to connect. Make sure you have updated the config.ts file with your OpenTok details.');
          });
      }
    });

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
