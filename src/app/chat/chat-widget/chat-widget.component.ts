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
import { IntroductionService } from 'app/services/introduction.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

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
  @Input() endorserId: any;
  @Input() expand: boolean;
  @Input() preview: boolean;
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

  constructor(private changeDetectorRef: ChangeDetectorRef, private adminService: AdminService, private angularFireDatabase: AngularFireDatabase, private firebaseService: FirebaseService, private userService: UserService, private opentokService: OpentokService, private sanitizer: DomSanitizer, private cryptoService: CryptoStorageService, private introductionService: IntroductionService, private db: AngularFirestore) { }
  public addMessage(from, element, type: 'received' | 'sent') {
    /* for (let [key, value] of this.customerVariables) {
      element.clabel = element.data.label.replace(key, value);
    } */
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
    this.visible = this.expand;
    this.existUserSession = this.userService.getUserSession();
    if (!this.preview) {
      this.db.collection('/advisers').doc(this.instanceId.toString()).get().subscribe((data) => {
        this.agentData = data.data();
        this.operator.name = this.agentData['agentName'];
        if (this.endorserId) {
          this.adminService.getEndorserProfileData('518').subscribe(userData => {
            this.endorserData = userData['data'];
          })
          this.introductionService.createIntroductionSession({ 'endorser_id': this.endorserId }).subscribe((response: any) => {
            this.introSessionID = response.IntroSessionID;
          });
        }
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
            this.chatElements = this.agentData['bots'][this.botId]['botData']['drawflow']['Home']['data'];
            this.firstElement = this.transformBotData(this.chatElements);
            this.angularFireDatabase.list(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}`).query.once("value").then(data => {
              var sessionMessage = data.val();
              var chatBackUp = JSON.parse(sessionMessage[this.cSessionId]);
              this.messages = chatBackUp['message'];
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

            });
            this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
              var messageHistory = Object.values(data);
              var lastMessage = messageHistory[messageHistory.length - 1];
              if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                this.agentLive = true;
                this.currentNode = '999';
                this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');

              }
            });
          });
        } else if (this.existUserSession && this.existUserSession.botId !== this.botId && !this.existUserSession.chatStatus) {
          this.adminService.getFbId(this.instanceId).subscribe(data => {
            this.firebaseId = data['firebase_id'];
            this.angularFireDatabase.object(`users/${this.firebaseId}`).valueChanges().subscribe(data => {
              this.operator.status = data['onlineStatus'] ? 'online' : '';
            });
            this.chatElements = this.agentData['bots'][this.botId]['botData']['drawflow']['Home']['data'];
            this.firstElement = this.transformBotData(this.chatElements);
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
              this.firebaseService.sendMessage(this.clientFirebaseId, this.firstElement, this.firstElement.data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
              this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                var messageHistory = Object.values(data);
                var lastMessage = messageHistory[messageHistory.length - 1];
                if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                  this.agentLive = true;
                  this.currentNode = '999';
                  this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');

                }
              });
            });
            setTimeout(() => {
              this.addMessage(this.operator, this.firstElement, 'received');
              if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
                this.nextNodeElement();
                setTimeout(() => this.proceedNext(), 3000)
              };
              this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? '999' : this.currentNode, message: this.messages }));
            }, 1500);
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
            this.chatElements = this.agentData['bots'][this.botId]['botData']['drawflow']['Home']['data'];
            this.firstElement = this.transformBotData(this.chatElements);
            //this.setAppearance(data['data']['appearance']);
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
                this.firebaseService.sendMessage(this.clientFirebaseId, this.firstElement, this.firstElement.data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
                this.angularFireDatabase.object(`messages/${this.firebaseId}/${this.cSessionId}`).valueChanges().subscribe(data => {
                  if (data) {
                    var messageHistory = Object.values(data);
                    var lastMessage = messageHistory[messageHistory.length - 1];
                    if ((this.agentLive || lastMessage.status === 'AGENT_LIVE') && lastMessage.senderId === this.firebaseId) {
                      this.agentLive = true;
                      this.currentNode = '999';
                      this.addMessage(this.operator, { data: { label: lastMessage.message }, live: true }, 'received');
                    }
                  }

                });
              });
            });
            setTimeout(() => {
              this.addMessage(this.operator, this.firstElement, 'received');
              if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
                this.nextNodeElement();
                setTimeout(() => this.proceedNext(), 3000)
              };
              this.angularFireDatabase.database.ref(`SessionBackup/${this.firebaseId}/${this.clientFirebaseId}/${this.cSessionId}`).set(JSON.stringify({ botId: this.botId, position: this.agentLive ? '999' : this.currentNode, message: this.messages }));
            }, 1500);
          });
        }

      });
    } else {
      this.db.collection('/advisers').doc(this.instanceId.toString()).get().subscribe((data) => {
        this.agentData = data.data();
        this.operator.name = this.agentData['agentName'];
        this.chatElements = this.agentData['bots'][this.botId]['botData']['drawflow']['Home']['data'];
        this.firstElement = this.transformBotData(this.chatElements);
        setTimeout(() => {
          this.addMessage(this.operator, this.firstElement, 'received');
          if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
            this.nextNodeElement();
            setTimeout(() => this.proceedNext(), 3000)
          };
        }, 1500);
      });
    }



  }
  videoSaved(event) {
    this.cryptoService.setItem('recordervideo.url', event);
    this.nextNodeElement();
    setTimeout(() => this.proceedNext(), 1000)
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
    if (!this.preview) {
      var elementType = this.messages[0].element.type;
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
        if (this.leadId) this.createLead();
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
    }

    this.addMessage(this.client, { data: { label: message } }, 'sent');
    this.nextNodeElement();
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
    if (this.currentNode !== '999' && this.nextNode) {
      if (!this.preview) this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.nextNode], this.chatElements[this.nextNode].data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.nextNode], 'received');
      this.currentNode = this.nextNode;
      if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
        this.nextNodeElement();
        setTimeout(() => this.proceedNext(), 3000)
      };
    } else if (this.fallBackNode) {
      this.nextNode = this.fallBackNode;
      this.fallBackNode = undefined;
      if (!this.preview) this.firebaseService.sendMessage(this.clientFirebaseId, this.chatElements[this.nextNode], this.chatElements[this.nextNode].data.label, this.firebaseId, 'CONV_OPEN', new Date().getTime(), 'BOT', this.cSessionId);
      this.addMessage(this.operator, this.chatElements[this.nextNode], 'received');
      this.currentNode = this.nextNode;
      if (!this.chatElements[this.currentNode].data.skipQuestion && (this.chatElements[this.currentNode].class !== "name" && this.chatElements[this.currentNode].class !== "email" && this.chatElements[this.currentNode].class !== "phone" && this.chatElements[this.currentNode].class !== "videoRecording" && this.chatElements[this.currentNode].class !== "socialSharing" && this.chatElements[this.currentNode].class !== "emailSharing" && this.chatElements[this.currentNode].class !== "appoinments" && this.chatElements[this.currentNode].class !== "multiChoice")) {
        this.nextNodeElement();
        setTimeout(() => this.proceedNext(), 3000)
      };
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
    if (this.botId !== message['botId']) {
      this.adminService.retrieveChatBot(message['botId'], this.instanceId).subscribe(data => {
        this.chatElements = data['data']['elements'];
      });
    }
  }
  public setAppearance(appearance) {
    this.fullScreen = appearance['fullscreen'] === 'true';
    if (this.fullScreen) {
      this.appearance.fullscreenbgimage = appearance['fullscreen_bgimage'];
      this.appearance.fullscreenheading = appearance['fullscreen_heading'];
      this.appearance.fullscreensubheading = appearance['fullscreen_subheading'];
      this.appearance.fullscreenbgcolor = appearance['fullscreen_bgcolor'];
      this.appearance.fullscreencolor = appearance['fullscreen_color'];
    }
    this.appearance.welcomeMessage = appearance['welcome_msg'];
    this.appearance.welcomeVideo = appearance['media'];

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
    this.addMessage(this.client, { data: { label: choice } }, 'sent');
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
