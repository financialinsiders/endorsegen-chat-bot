import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { Injector, NgModule } from '@angular/core'
import { AdminService } from './services/admin-service';
import { HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements'
import { ChatModule, ChatWidgetComponent, ChatConfigComponent } from './chat/'
import { UserService } from './services/user.service';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'environments/environment.prod';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, ChatModule, HttpClientModule, AngularFireModule.initializeApp(environment.firebaseConfig), MatStepperModule, MatExpansionModule, FormsModule, MatRadioModule],
  exports: [ChatModule],
  providers: [AdminService, UserService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ElementModule {
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const chatConfig = <any>createCustomElement(ChatConfigComponent, {
      injector: this.injector,
    })
    const chatWidget = <any>createCustomElement(ChatWidgetComponent, {
      injector: this.injector,
    })
    customElements.define('chat-config', chatConfig)
    customElements.define('chat-widget', chatWidget)
  }
}
