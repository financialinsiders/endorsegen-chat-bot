import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core'
import { AngularFireDatabase } from '@angular/fire/database'

@Component({
  selector: 'chat-input',
  template: `
    <textarea type="text" (keyup)="onKeySearch($event)" class="chat-input-text" placeholder="Type message..."
              #message (keydown.enter)="onSubmit()" (keyup.enter)="message.value = ''" (keyup.escape)="dismiss.emit()"></textarea>
              <button
  ion-button
  clear
  icon-only
  (click)="toggled = !toggled"
  [(emojiPickerIf)]="toggled"
  [emojiPickerDirection]="'top'"
  (emojiPickerSelect)="handleSelection($event)"
  class="chat-input-emoji"
>
<img src="https://fiapps.s3.ca-central-1.amazonaws.com/assets/smile.png" alt="Submit" style="width:25px">
  <ion-icon name="md-happy"></ion-icon>
</button>
    <button type="submit" class="chat-input-submit" (click)="onSubmit()">
      {{buttonText}}
    </button>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./chat-input.component.scss'],
})
export class ChatInputComponent implements OnInit {
  @Input() public buttonText = '↩︎'
  @Input() public focus = new EventEmitter()
  @Output() public send = new EventEmitter()
  @Output() public type = new EventEmitter()
  @Output() public dismiss = new EventEmitter()
  @ViewChild('message', { static: true }) message: ElementRef
  timeout: any = null;
  isTyping: boolean;
  toggled: boolean = false;
  constructor() { }
  ngOnInit() {
    this.focus.subscribe(() => this.focusMessage())
  }
  handleSelection(event) {
    this.message.nativeElement.value += event.char;
  }
  public focusMessage() {
    this.message.nativeElement.focus()
  }

  public getMessage() {
    return this.message.nativeElement.value
  }
  onKeySearch(event: any) {
    if (!this.isTyping) {
      this.type.emit(true);
      this.isTyping = true;
    }
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (event.keyCode != 13) {
        this.type.emit(false);
        this.isTyping = false;
      }
    }, 1000);
  }
  public clearMessage() {
    this.type.emit(false);
    this.message.nativeElement.value = ''
  }

  onSubmit() {
    this.type.emit(false);
    const message = this.getMessage()
    if (message.trim() === '') {
      return
    }
    this.send.emit({ message })
    this.clearMessage()
    this.focusMessage()
  }

}
