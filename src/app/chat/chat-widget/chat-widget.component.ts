import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { AdminService } from '../../services/admin-service'
import { Subject } from 'rxjs'
import { fadeIn, fadeInOut } from '../animations'
import { AngularFireDatabase } from '@angular/fire/database';
import { FirebaseService } from 'app/services/firebase.service';
import { UserService } from 'app/services/user.service';
import { OpentokService } from 'app/services/opentok.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CryptoStorageService } from 'app/services/crypto-storage.service';
import { IntroductionService } from 'app/services/introduction.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { AngularFirestore } from '@angular/fire/firestore';
import { IpService } from 'app/services/ip.service';
import firebase from 'firebase';

const rand = max => Math.floor(Math.random() * max)

@Component({
  selector: 'chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  animations: [fadeInOut, fadeIn],
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('bottom') bottom: ElementRef
  @Input() public theme: 'blue' | 'grey' | 'red' = 'blue';
  @Input() public botId;
  @Input() public instanceId;
  @Input() public endorserId: string;
  @Input() public endorserBot: string;
  @Input() public testID: string;
  @Input() expand: boolean;
  @Input() preview: boolean;
  @Input() public liveBot;
  public fullScreen: boolean;
  public _visible = false;
  public firebaseId: any
  public chatElements: any
  public currentNode: string;
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
  introSessionID: any;
  endorserData: any;
  liveAgentCredential: string;
  appearance: any = {
    fullscreenbgimage: ''
  };
  public editorconfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '200px',
    maxHeight: 'auto',
    toolbarHiddenButtons: [
      ['strikeThrough',
        'subscript',
        'superscript',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'indent',
        'outdent',
        'insertUnorderedList',
        'insertOrderedList',
        'heading',
        'fontName'
      ],
      [
        'fontSize',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
        'textColor',
        'backgroundColor',
      ]
    ]
  };
  customerVariables: Map<String, String> = new Map<String, String>();
  editMode: boolean;
  agentData: any;
  firstElement: any;
  nextNode: any;
  fallBackNode: any;
  welcomeMessage: any;
  welcomeButtonText: any;
  welcomeVideoUrl: any;
  connectingToAgent: boolean;
  botAliseName: any;
  botTitle: string;
  botIcon: string;
  liveAgentName: any;
  isTyping: any;
  showWelcomeMessageBox: boolean = true;
  isBotLoading: boolean = false;
  lastLiveMessage: any;
  agentProfileImage: any;
  hideInputFeild: boolean;
  notificationSettings: any;
  agentEmail: any;
  messagesResponse: any;
  backgroundImage: any;
  headline: any;
  subHeadline: any;
  colorTheme: any;
  botData: any;
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
    title: 'Virtual assistant',
    status: 'online',
    avatar: `https://fiapps.s3.ca-central-1.amazonaws.com/assets/bot.png`,
    onlineStatusMessage: '',
    offlineStatusMessage: '',
    busyStatusMessage: '',
    onlineStatus: ''
  }

  public client = {
    name: 'Guest User',
    status: 'online',
    avatar: `https://fiapps.s3.ca-central-1.amazonaws.com/assets/client.png`,
  }

  public messages = []
  public suggestionList = [];
  constructor(private changeDetectorRef: ChangeDetectorRef, private adminService: AdminService, private angularFireDatabase: AngularFireDatabase, private firebaseService: FirebaseService, private userService: UserService, private opentokService: OpentokService, private sanitizer: DomSanitizer, private cryptoService: CryptoStorageService, private introductionService: IntroductionService, private db: AngularFirestore, private ipService: IpService) { }
  public addMessage(from, element, type: 'received' | 'sent') {
    /* for (let [key, value] of this.customerVariables) {
      element.clabel = element.data.label.replace(key, value);
    } */
    if (element.class === 'appoinments' || element.class === 'suggestion' || element.class === 'video' || element.class === 'image' || element.class === 'videoRecording' || element.class === 'socialSharing' || element.class === 'emailSharing' || element.class === 'textEditor' || element.class === 'multiChoice') {
      this.hideInputFeild = true;
    } else {
      this.hideInputFeild = false;
    }
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
  public typing(flag) {

    if (!this.liveBot) {

      this.isBotLoading = false;
      this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
        "userTyping": flag
      });

    }

  }
  public closeWelcomeBox() {
    this.showWelcomeMessageBox = false;
  }
  public suggestionSelect() {
    this.messages[0].hide = true;
    this.sendMessage({ message: this.suggestionList.join(', ') });
  }
  public onSuggestionSelect(choice) {
    if (this.suggestionList.length === 0 || this.suggestionList.indexOf(choice) === -1) {
      this.suggestionList.push(choice)
    } else {
      const index = this.suggestionList.indexOf(choice);
      if (index > -1) {
        this.suggestionList.splice(index, 1);
      }
    }
  }
  async getEndorsersAync(endorserId) {
    console.log("Called: " + endorserId);
    const snapshot = await firebase.firestore().collection('endorsers').doc(endorserId).get();
    return snapshot.data();
  }
  async getEndoserData(endorserId) {
    var endorsers = await this.getEndorsersAync(endorserId);
    return endorsers;
  }
  ngOnDestroy() {
    this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
      "userTyping": false
    });
  }
  ngOnInit() {
    this.visible = this.expand;
    this.existUserSession = this.userService.getUserSession();

    console.log("test ID : " + this.testID);
    if (!this.preview && !this.liveBot) {
      this.db.collection('/advisers').doc(this.instanceId.toString()).get().subscribe(async (data) => {
        this.agentData = data.data();
        this.firebaseId = this.agentData['firebaseId'];
        console.log("agent firebase id: " + this.firebaseId);
        this.liveAgentName = this.agentData['agentName'];
        this.liveAgentCredential = this.agentData['credential'];
        this.agentProfileImage = this.agentData['agentProfileImage'];
        this.notificationSettings = this.agentData['notificationSettings'];
        this.agentEmail = this.agentData['email'];
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
          this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
            this.operator.status = data['onlineStatus'];
            this.operator.onlineStatus = data['onlineStatus'];
            this.operator.onlineStatusMessage = data['onlineStatusMessage'];
            this.operator.offlineStatusMessage = data['offlineStatusMessage'];
            this.operator.busyStatusMessage = data['busyStatusMessage'];
          });
          this.getBotData();
          if (this.endorserId) {
            this.endorserData = await this.getEndoserData(this.endorserId);
          };
          this.angularFireDatabase.list(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}`).query.once("value").then(data => {
            var sessionMessage = data.val();
            var chatBackUp = JSON.parse(sessionMessage[this.cSessionId]);
            this.messages = chatBackUp['message'];
            if (this.notificationSettings.newLeadEmail) {
              var historyView = '<div style="margin: 0 auto;width: 100%;"><div style="background: gainsboro;padding: 30px;border-radius: 10px;">';
              this.messages.forEach(message => {
                if (message.type === "received") {
                  historyView += '<div style="width: 50%;background: white;overflow: hidden;padding: 10px;border-radius: 10px;max-width: fit-content;margin: 10px;">' + message.element.data.label + '</div>'
                } else {
                  historyView += '<div style="width: 100%;display: inline-block;"><div style="float:right;width:auto;background: #03a9f4;overflow: hidden;padding: 10px;border-radius: 10px;margin: 10px;color: white;">' + message.element.data.label + '</div></div>'
                }
              });
              historyView += '<a href="http://localhost:3000/#!/conversations?sessionId=' + this.cSessionId + '" type="button" style="margin: auto;display: block;padding: 10px;background: #ec4404f7;color: white;border-radius: 10px;border-color: transparent;width: 30%;text-align: center;text-decoration: none;">Replay to conversation</a></div></div>';
              var requestParams = {
                "to": this.agentEmail,
                "subject": "You have got your leader visitor back to site",
                "template": "leadUser",
                "meetingURL": `http://localhost:4200/apps/chat?selectedMessage=${this.cSessionId}`,
                "fromAddress": "notifications@financialinsiders.io",
                "fromName": 'Notifications via Financial Insiders',
                "replyToName": this.cryptoService.getItem('name'),
                "replyToEmail": this.cryptoService.getItem('email'),
                "historyView": historyView,
                "bodyHeading": 'You have got your lead visitor back to the site!'
              }

              this.adminService.sendEmailNotificationWithTemplate(requestParams).subscribe(data => {
                console.log(data);
              });
            }
            this.currentNode = chatBackUp['position'];
            var outputConnection = this.chatElements[this.currentNode].outputs.output_1.connections;
            if (this.chatElements[this.currentNode].class !== 'multiChoice' && outputConnection && outputConnection.length > 0) {
              this.nextNode = outputConnection[0].node;
            }
            for (let [key, value] of Object.entries(sessionMessage)) {
              var eachMessage = JSON.parse(value.toString());
              eachMessage['key'] = key;
              this.sessionHistoryChatList.push(eachMessage);
            };
          });

          this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
            this.isTyping = data['isAgentTyping'];

          });
          this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
            var messageHistory = Object.values(data);
            var lastMessage = messageHistory[messageHistory.length - 1];
            if (lastMessage.status === 'INSTANT_MEETING') {
              this.addMessage(this.operator, { data: { label: 'Please click below button to join the meeting.', status: 'INSTANT_MEETING', clientRedirectUrl: lastMessage.clientRedirectUrl }, live: true }, 'received');
              this.joinMeeting(lastMessage.clientRedirectUrl);
            }
            if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
              this.agentLive = true;
              this.lastLiveMessage = lastMessage.message;
              this.operator.name = this.liveAgentName;
              this.operator.title = this.liveAgentCredential;
              this.currentNode = '999';
              this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');

            }
          });
        } else if (this.existUserSession && this.existUserSession.botId !== this.botId && !this.existUserSession.chatStatus) {
          this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
            this.operator.status = data['onlineStatus'];
            this.operator.onlineStatus = data['onlineStatus'];
            this.operator.onlineStatusMessage = data['onlineStatusMessage'];
            this.operator.offlineStatusMessage = data['offlineStatusMessage'];
            this.operator.busyStatusMessage = data['busyStatusMessage'];
          });
          this.getBotData();

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
            isNewMsg: true,
            isNewUser: true
          };
          if (this.botAliseName) sessionInfo['botAliseName'] = this.botAliseName;
          if (this.botIcon) sessionInfo['botIcon'] = this.botIcon;
          if (this.endorserId) {
            this.endorserData = await this.getEndoserData(this.endorserId);
          };
          this.angularFireDatabase.database.ref(`sessions/${this.firebaseId}`).push(sessionInfo).then((data) => {
            console.log(data);
            this.cSessionId = data.key;
            this.userService.setUserSession({
              clientFirebaseId: this.clientFirebaseId,
              cSessionId: this.cSessionId,
              botId: this.botId,
              chatStatus: false
            });
            this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
              this.isTyping = data['isAgentTyping'];
            });
            this.firebaseService.sendMessage(this.clientFirebaseId, this.firstElement, this.firstElement.data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
            this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
              var messageHistory = Object.values(data);
              var lastMessage = messageHistory[messageHistory.length - 1];
              if (lastMessage.status === 'INSTANT_MEETING') {
                this.addMessage(this.operator, { data: { label: 'Please click below button to join the meeting.', status: 'INSTANT_MEETING', clientRedirectUrl: lastMessage.clientRedirectUrl }, live: true }, 'received');
                this.joinMeeting(lastMessage.clientRedirectUrl);
              }
              if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                this.agentLive = true;
                this.lastLiveMessage = lastMessage.message;
                this.operator.name = this.liveAgentName;
                this.operator.title = this.liveAgentCredential;
                this.currentNode = '999';
                this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');

              }
            });
          });
          setTimeout(() => {
            this.addMessage(this.operator, this.firstElement, 'received');
            if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "textQuestion" && this.chatElements[this.currentNode].class !== "suggestion" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
              this.nextNodeElement();
              setTimeout(() => this.proceedNext(), 3000)
            };
            this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? '999' : this.currentNode, message: this.messages }));
          }, 1500);
        } else {
          this.angularFireDatabase.object(`notify-users/${this.instanceId}`).update({
            type: 'new-user',
            newNotification: true
          });
          this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
            this.operator.status = data['onlineStatus'];
            this.operator.onlineStatus = data['onlineStatus'];
            this.operator.onlineStatusMessage = data['onlineStatusMessage'];
            this.operator.offlineStatusMessage = data['offlineStatusMessage'];
            this.operator.busyStatusMessage = data['busyStatusMessage'];
          });
          this.getBotData();

          //this.setAppearance(data['data']['appearance']);

          this.ipService.getIpDetails().subscribe(ipData => {
            const toMatch = [
              /Android/i,
              /webOS/i,
              /iPhone/i,
              /iPad/i,
              /iPod/i,
              /BlackBerry/i,
              /Windows Phone/i
            ];

            var isMobile = toMatch.some((toMatchItem) => navigator.userAgent.match(toMatchItem));
            var userInfo = {
              connectedAgentId: this.instanceId,
              username: 'New User',
              agentId: this.firebaseId,
              browserSession: ipData,
              device: isMobile ? 'Mobile' : 'Desktop',
              sourceUrl: window.location.href
            }
            this.angularFireDatabase.database.ref('users/').push(userInfo).then(async (userData) => {
              console.log("Data pushed");
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
                isNewMsg: true,
                isNewUser: true,
                botAliseName: this.botAliseName,
                botIcon: this.botIcon
              };
              if (this.endorserId) {
                console.log("session is endorser");
                sessionInfo['endorserId'] = this.endorserId;
                this.endorserData = await this.getEndoserData(this.endorserId);
              };
              if (this.endorserBot) {
                sessionInfo['endorserBot'] = this.endorserBot;
                this.endorserData = await this.getEndoserData(this.endorserId);
                sessionInfo['username'] = this.endorserData['name'];
                sessionInfo['email'] = this.endorserData['email'];
                sessionInfo['phone'] = this.endorserData['phone'];
                this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
                  username: this.endorserData['name'],
                  email: this.endorserData['email'],
                  phone: this.endorserData['phone'],
                });
              }
              this.angularFireDatabase.database.ref(`sessions/${this.firebaseId}`).push(sessionInfo).then((data) => {
                this.cSessionId = data.key;
                if (this.notificationSettings.anonymousLeadEmail) {
                  var requestParams = {
                    "to": this.agentEmail,
                    "subject": "You have got a new client",
                    "template": "newUser",
                    "meetingURL": `http://localhost:4200/apps/chat?selectedMessage=${this.cSessionId}`,
                    "fromAddress": "notifications@financialinsiders.io",
                    "fromName": 'Notifications via Financial Insiders',
                    "replyToName": 'New User',
                    "replyToEmail": 'abc@gmail.com',
                  }
                  this.adminService.sendEmailNotificationWithTemplate(requestParams).subscribe(data => { });
                }
                this.userService.setUserSession({
                  clientFirebaseId: this.clientFirebaseId,
                  cSessionId: this.cSessionId,
                  botId: this.botId,
                  chatStatus: false
                });
                this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                  this.isTyping = data['isAgentTyping'];
                });
                this.firebaseService.sendMessage(this.clientFirebaseId, this.firstElement, this.firstElement.data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
                this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                  if (data) {
                    var messageHistory = Object.values(data);
                    var lastMessage = messageHistory[messageHistory.length - 1];
                    if (lastMessage.status === 'INSTANT_MEETING') {
                      this.addMessage(this.operator, { data: { label: 'Please click below button to join the meeting.', status: 'INSTANT_MEETING', clientRedirectUrl: lastMessage.clientRedirectUrl }, live: true }, 'received');
                      this.joinMeeting(lastMessage.clientRedirectUrl);
                    }
                    if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                      this.agentLive = true;
                      this.lastLiveMessage = lastMessage.message;
                      this.operator.name = this.liveAgentName;
                      this.operator.title = this.liveAgentCredential;
                      this.currentNode = '999';
                      this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');
                    }
                  }

                });
              });
            });
            setTimeout(() => {
              this.addMessage(this.operator, this.firstElement, 'received');
              if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "textQuestion" && this.chatElements[this.currentNode].class !== "suggestion" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
                this.nextNodeElement();
                setTimeout(() => this.proceedNext(), 3000)
              };
              this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? '999' : this.currentNode, message: this.messages }));
            }, 1500);
          });
        }

      });
    } else if (this.preview && !this.liveBot) {
      this.db.collection('/advisers').doc(this.instanceId.toString()).get().subscribe((data) => {
        this.agentData = data.data();
        this.operator.name = this.agentData['agentName'];
        this.firebaseId = this.agentData['firebaseId'];
        if (this.botAliseName) this.operator.name = this.botAliseName;
        this.getBotData();
        setTimeout(() => {
          this.addMessage(this.operator, this.firstElement, 'received');
          if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "textQuestion" && this.chatElements[this.currentNode].class !== "suggestion" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
            this.nextNodeElement();
            setTimeout(() => this.proceedNext(), 3000)
          };
        }, 1500);
      });
    } else {
      this.db.collection('/advisers').doc(this.instanceId.toString()).get().subscribe((data) => {
        this.agentData = data.data();
        this.firebaseId = this.agentData['firebaseId'];
        this.operator.title = this.agentData.credential;
        this.operator.name = this.agentData.agentName;
        this.angularFireDatabase.object(`endorser-messages/${this.firebaseId}/${this.endorserId}`).valueChanges().subscribe(data => {
          if (data) {
            this.messagesResponse = Object.values(data);
            this.messagesResponse.forEach(message => {
              this.addMessage(this.operator, { data: { label: message.message }, live: true }, this.firebaseId === message.senderId ? 'received' : 'sent');
            });
          }


        });
        setTimeout(() => {
          var senderMessage = {
            chatId: this.firebaseId,
            message: 'Hi, How can I help you?',
            conversationId: this.endorserId,
            senderId: this.firebaseId,
            status: 'CONV_OPEN',
            timestamp: new Date().getTime(),
            type: 'BOT',
          }

          this.angularFireDatabase.database.ref(`endorser-messages/${this.firebaseId}/${this.endorserId}`).push(senderMessage);
          this.db.collection('/endorsers').doc(this.endorserId).get().subscribe((data) => {
            this.endorserData = data.data();
            var endorserSession = {
              username: this.endorserData['name'],
              email: this.endorserData['email'],
              phone: this.endorserData['phone'],
              address: this.endorserData['address'],
              timestamp: new Date().getTime(),
              lastMessage: 'Hi, How can I help you?',
              endorserId: this.endorserId
            }
            this.angularFireDatabase.database.ref(`endorser-session/${this.firebaseId}/${this.endorserId}`).update(endorserSession);
          })

        }, 1500);

      });
    }



  }
  videoSaved(event) {
    this.cryptoService.setItem('recordervideo.url', event);
    this.nextNodeElement();
    setTimeout(() => this.proceedNext(), 1000)
  }
  joinMeeting(url) {
    window.open(url);
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
  getBotData() {
    this.db.collection('/bots').doc(this.botId.toString()).get().subscribe((data) => {
      this.botData = data.data();
      this.fullScreen = this.botData['isFullScreenBot'];
      this.botAliseName = this.botData['botAliseName'];
      this.botIcon = this.botData['botIcon'];
      this.botTitle = this.botData['botTitle'];
      this.operator.name = this.botAliseName;
      this.operator.title = this.botTitle;
      this.welcomeMessage = this.botData['welcomeMessage'];
      this.welcomeButtonText = this.botData['welcomeButtonText'];
      this.welcomeVideoUrl = this.botData['welcomeVideoUrl'];
      this.backgroundImage = this.botData['backgroundImage'];
      this.headline = this.botData['headline'];
      this.subHeadline = this.botData['subHeadline'];
      this.colorTheme = this.botData['colorTheme'];
      this.chatElements = this.botData['botData']['drawflow']['Home']['data'];
      this.operator.avatar = this.botIcon;
      this.firstElement = this.transformBotData(this.chatElements);
    });
  }
  public historyChat() {
    this.historyMode = !this.historyMode;
  }
  public removeHTML(text) {
    var formatedText = text;
    if (text && (text.includes('@agent') || text.includes('@endorser') || text.includes('@user'))) {
      formatedText = formatedText.replace('@agent_first_name', this.agentData.agentName.split(' ')[0]);
      formatedText = formatedText.replace('@agent_last_name', this.agentData.agentName.split(' ')[1]);
      formatedText = formatedText.replace('@agent_email', this.agentData.email);
      var userName = this.cryptoService.getItem('name');
      if (userName) {
        formatedText = formatedText.replace('@user_name', userName);
      }
      if (this.endorserId) {
        formatedText = formatedText.replace('@endorser_first_name', this.endorserData.name.split(' ')[0]);
        formatedText = formatedText.replace('@endorser_last_name', this.endorserData.name.split(' ')[1]);
        formatedText = formatedText.replace('@endorser_email', this.endorserData.email);
      }
    }
    formatedText = formatedText.replace(/<\/?[^>]+(>|$)/g, "");
    return formatedText;
  }
  getSafeUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }
  public sendMessage({ message }) {
    // console.log("send Message");

    if (!this.liveBot) {

      this.isBotLoading = true;
    }
    if (message.trim() === '') {
      return
    }
    if (!(this.preview || this.liveBot)) {
      var elementType = this.messages[0].element.class;
      var customvariable = this.messages[0].element.data;
      if (customvariable && customvariable.storevariable === '1') {
        this.customerVariables.set(`@${customvariable.variablename}`, message);
        this.cryptoService.setItem('customvariables', this.customerVariables);
      };
      if (elementType === 'name') {
        this.name = message;
        this.cryptoService.setItem('name', this.name);
        this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
          username: message,
        });
        this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
          username: message,
        });
        if (this.leadId) this.createLead();
      } else if (elementType === 'email') {
        this.email = message;
        this.cryptoService.setItem('email', this.email);
        this.createLead();
        this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
          email: message,
          leadUser: true,
        });
        this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
          email: message,
          leadUser: true,
        });
      } else if (elementType === 'phone') {
        this.phone = message;
        this.cryptoService.setItem('phone', this.phone);
        this.createLead();
        this.angularFireDatabase.object(`users/${this.clientFirebaseId}`).update({
          phone: message,
          leadUser: true,
        });
        this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
          phone: message,
          leadUser: true,
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
      this.angularFireDatabase.database.ref(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
        lastMessage: message,
        lastMessageType: 'CONV_OPEN',
        isNewMsg: true,
        isNewUser: false,
        timestamp: new Date().getTime()
      });
    }
    if (this.liveBot) {
      var senderEndMessage = {
        chatId: this.endorserId,
        message: message,
        conversationId: this.firebaseId,
        senderId: this.endorserId,
        status: 'CONV_OPEN',
        timestamp: new Date().getTime(),
        type: 'USER',
      }
      this.angularFireDatabase.database.ref(`endorser-messages/${this.firebaseId}/${this.endorserId}`).push(senderEndMessage);

      this.angularFireDatabase.database.ref(`endorser-session/${this.firebaseId}/${this.endorserId}`).update({
        timestamp: new Date().getTime(),
        lastMessage: message,
      });
      this.addMessage(this.client, { data: { label: message } }, 'sent');

    } else {
      this.addMessage(this.client, { data: { label: message } }, 'sent');
      this.nextNodeElement();
      setTimeout(() => this.proceedNext(), 1000)
    }

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
    if (this.currentNode !== '999' && this.nextNode) {
      if (!this.preview) this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.nextNode], this.chatElements[this.nextNode].data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.nextNode], 'received');
      this.currentNode = this.nextNode;
      this.isBotLoading = false;
      if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "textQuestion" && this.chatElements[this.currentNode].class !== "suggestion" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
        this.nextNodeElement();
        this.isBotLoading = false;
        setTimeout(() => this.proceedNext(), 3000)
      };
    } else if (this.fallBackNode && this.fallBackNode.length > 0) {
      this.nextNode = this.fallBackNode;
      this.fallBackNode = undefined;
      if (!this.preview) this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.nextNode], this.chatElements[this.nextNode].data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.nextNode], 'received');
      this.currentNode = this.nextNode;
      this.isBotLoading = false;
      if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "textQuestion" && this.chatElements[this.currentNode].class !== "suggestion" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
        this.nextNodeElement();
        this.isBotLoading = true;
        setTimeout(() => this.proceedNext(), 3000)
      };
    } else if (!this.nextNode && !this.chatElements[this.currentNode].data.endQuestion) {
      var connectToAgent = {
        "name": "connectingToAgent",
        "data": {
          "skipQuestionText": "I'm not sure",
          "label": "Please wait a while, We are connecting you to Human agent....",
        },
        "id": 5,
        "class": "connectingToAgent"
      }
      this.firebaseService.sendMessage(this.clientFirebaseId, connectToAgent, connectToAgent.data.label, this.firebaseId, 'USER_CONNECTING', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, connectToAgent, 'received');
      this.isBotLoading = false;
      var customlabel;
      if (this.operator.onlineStatus === 'online') {
        customlabel = this.operator.onlineStatusMessage
      } else if (this.operator.onlineStatus === 'offline') {
        customlabel = this.operator.offlineStatusMessage
      } else {
        customlabel = this.operator.busyStatusMessage
      }
      var statusMessage = {
        "name": "agentResponse",
        "data": {
          "skipQuestionText": "I'm not sure",
          "label": customlabel,
        },
        "id": 5,
        "class": "connectingToAgent"
      }
      this.firebaseService.sendMessage(this.clientFirebaseId, statusMessage, statusMessage.data.label, this.firebaseId, 'USER_AWAITING', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, statusMessage, 'received');

    } else if (this.chatElements[this.currentNode].data.endQuestion) {
      this.visible = !this.visible;
    }

    if (!this.preview) this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? '999' : this.currentNode, message: this.messages }));


  }
  public nextClicked(index) {
    this.messages[index].element.data.pause = '0';
    this.chatElements[this.currentNode].data.pause = '0';
    this.nextNodeElement();
    this.proceedNext();
  }
  public saveAndNextClicked() {
    this.editMode = false;
    this.nextNodeElement();
    this.proceedNext();
  }
  public editText() {
    this.editMode = true;
  }
  public selectMessage(message) {
    this.cSessionId = message['key'];
    this.messages = message['message'];
    this.currentNode = message['position'];
    var outputConnection = this.chatElements[this.currentNode].outputs.output_1.connections;
    if (this.chatElements[this.currentNode].class !== 'multiChoice' && outputConnection && outputConnection.length > 0) {
      this.nextNode = outputConnection[0].node;
    }
    this.historyMode = !this.historyMode;
    this.userService.setUserSession({
      clientFirebaseId: this.clientFirebaseId,
      cSessionId: this.cSessionId,
      botId: this.botId,
      chatStatus: true
    });
  }
  public multiChoiceSelect(choice, index, totalLength) {
    this.fallBackNode = this.chatElements[this.currentNode].outputs[`output_${totalLength + 1}`].connections;
    if (this.fallBackNode && this.fallBackNode.length > 0) {
      this.fallBackNode = this.fallBackNode[0].node;
    }
    var senderMessage = {
      chatId: this.clientFirebaseId,
      message: choice,
      conversationId: this.firebaseId,
      senderId: this.clientFirebaseId,
      status: 'CONV_OPEN',
      timestamp: new Date().getTime()
    }
    this.messages[0].hide = true;
    if (!this.preview) this.angularFireDatabase.database.ref(`messages/${this.firebaseId}/${this.cSessionId}`).push(senderMessage);
    this.angularFireDatabase.database.ref(`sessions/${this.firebaseId}/${this.cSessionId}`).update({
      lastMessage: choice,
      lastMessageType: 'CONV_OPEN',
      isNewMsg: true,
      isNewUser: false,
      timestamp: new Date().getTime()
    });
    this.addMessage(this.client, { data: { label: choice } }, 'sent');
    this.isBotLoading = true;
    var outputConnection = this.chatElements[this.currentNode].outputs[`output_${index + 1}`].connections;
    if (outputConnection && outputConnection.length > 0) {
      this.currentNode = this.nextNode;
      this.nextNode = outputConnection[0].node;
    }
    setTimeout(() => this.proceedNext(), 1000)
  }
  nextNodeElement() {
    var outputConnection = this.chatElements[this.currentNode].outputs.output_1.connections;
    if (this.chatElements[this.currentNode].class !== 'multiChoice' && outputConnection && outputConnection.length > 0) {
      this.currentNode = this.nextNode;
      this.nextNode = outputConnection[0].node;
    } else {
      this.nextNode = undefined;
    }
  }
  transformBotData(botDatas) {
    for (let key in botDatas) {
      let value = botDatas[key].inputs.input_1.connections;
      if (value.length === 0) {
        this.currentNode = key;
        var outputConnection = botDatas[key].outputs.output_1.connections;
        if (botDatas[key].class !== 'multiChoice' && outputConnection && outputConnection.length > 0) {
          this.nextNode = outputConnection[0].node;
        }
        return botDatas[key];
      }
    }
  }
  public initializeSession(clientFirebaseId) {
    this.angularFireDatabase.object(`users/${clientFirebaseId}`).update({
      status: true,
    });
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
            alert('Unable to connect. Make sure you have updated the config.ts file with your OpenTok details.');
          });
      }
    });
    this.angularFireDatabase.object(`users/${clientFirebaseId}`).query.ref.onDisconnect()
      .update({
        status: false,
        lastSeen: new Date().getTime(),
      });
    this.angularFireDatabase.object(`sessions/${this.firebaseId}/${this.cSessionId}`).query.ref.onDisconnect()
      .update({
        userTyping: false
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
