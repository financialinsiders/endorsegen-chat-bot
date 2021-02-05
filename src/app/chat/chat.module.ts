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
import { VideoRecorderComponent } from './video-recorder/video-recorder.component';
import { SocialSharingComponent } from './social-sharing/social-sharing.component';
import { EmailSharingComponent } from './email-sharing/email-sharing.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [CommonModule, HttpClientModule, MatStepperModule, MatExpansionModule, FormsModule, MatRadioModule],
  declarations: [ChatAvatarComponent, ChatWidgetComponent, ChatInputComponent, ChatConfigComponent, SubscriberComponent, PublisherComponent, CronofyComponent, VideoRecorderComponent, SocialSharingComponent, EmailSharingComponent],
  exports: [ChatWidgetComponent, ChatConfigComponent],
  entryComponents: [ChatWidgetComponent, ChatConfigComponent],
  providers: [AdminService, UserService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatModule {}
