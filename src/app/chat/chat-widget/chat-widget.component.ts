import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core'
import { AdminService } from '../../services/admin-service'
import { Subject } from 'rxjs'
import { fadeIn, fadeInOut } from '../animations'
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';

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

  constructor(private adminService: AdminService, private angularFireDatabase: AngularFireDatabase) { }
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
    //setTimeout(() => this.visible = true, 1000)
    var sessionInfo = {
      username: 'Anonymous',
      user_attempt: false,
      timestamp: new Date().getTime(),
      bot_id: this.botId,
      user_id: 'vm.uid',
      bot_title: 'vm.botInfo.title',
      page_link: window.top.location.href,
      status: 'OPEN',
      //meeting_id: $rootScope.fiApp.meetingId,
      bot_type: 'vm.botInfo.chat_type',
      isNewMsg: true
    };
    this.angularFireDatabase.object('notify-users/' + this.instanceId).update({
      type: 'new-user',
      newNotification: true
    });
    this.adminService.getFbId(this.instanceId).subscribe(data => {
      this.firebaseId = data['firebase_id'];
      this.adminService.retrieveChatBot(this.botId, this.instanceId).subscribe(data => {
        this.chatElements = data['data']['elements'];
        console.log(this.chatElements);
        this.angularFireDatabase.database.ref('sessions/' + this.firebaseId).push(sessionInfo).then((data) => {
          
          this.cSessionId = data.key;
          this.angularFireDatabase.object('sessions/' + this.firebaseId + '/' + this.cSessionId).valueChanges().subscribe(data => {
            console.log(data);
          });
          var userInfo = {
            connectedAgentId: this.instanceId,
          }
          this.angularFireDatabase.database.ref('users/').push(userInfo).then((userData) => {
            this.clientFirebaseId = userData.key;
            var firstMessage = {
              chatId: this.clientFirebaseId,
              metadata: this.chatElements[0],
              message: this.chatElements[0].clabel,
              conversationId: this.firebaseId,
              senderId: this.firebaseId,
              status: 'CONV_OPEN',
              timestamp: 1610987426109,
              type: 'BOT'
            }
            this.angularFireDatabase.database.ref('messages/' + this.firebaseId + '/' + this.cSessionId).push(firstMessage);
            
            this.angularFireDatabase.object('messages/' + this.firebaseId + '/' + this.cSessionId).valueChanges().subscribe(data => {
              console.log(data);
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
    this.addMessage(this.client, message, 'sent');
    var firstMessage = {
      chatId: this.clientFirebaseId,
      metadata: this.chatElements[0],
      message: this.chatElements[0].clabel,
      conversationId: this.firebaseId,
      senderId: this.firebaseId,
      status: 'CONV_OPEN',
      timestamp: 1610987426109,
      type: 'BOT'
    }
    this.angularFireDatabase.database.ref('messages/' + this.firebaseId + '/' + this.cSessionId).push(firstMessage);
    setTimeout(() => this.proceedNext(), 1000)
  }
  public proceedNext() {
    this.addMessage(this.operator, this.chatElements[this.currentIndex], 'received');
    this.currentIndex += 1;
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
