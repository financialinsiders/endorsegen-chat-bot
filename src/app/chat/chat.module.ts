import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ChatAvatarComponent } from './chat-avatar/chat-avatar.component'
import { ChatWidgetComponent } from './chat-widget/chat-widget.component'
import { ChatInputComponent } from './chat-input/chat-input.component'
import { ChatConfigComponent } from './chat-config/chat-config.component'
import { AdminService } from 'app/services/admin-service'
import { HttpClientModule } from '@angular/common/http';
import { UserService } from 'app/services/user.service';
import { SubscriberComponent } from './subscriber/subscriber.component';
import { PublisherComponent } from './publisher/publisher.component';
import { CronofyComponent } from './cronofy/cronofy.component';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [ChatAvatarComponent, ChatWidgetComponent, ChatInputComponent, ChatConfigComponent, SubscriberComponent, PublisherComponent, CronofyComponent],
  exports: [ChatWidgetComponent, ChatConfigComponent],
  entryComponents: [ChatWidgetComponent, ChatConfigComponent],
  providers: [AdminService, UserService]
})
export class ChatModule {}
