import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { Injector, NgModule } from '@angular/core'
import { AdminService } from './services/admin-service';
import { HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements'
import { ChatModule, ChatWidgetComponent, ChatConfigComponent } from './chat/'
import { UserService } from './services/user.service';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, ChatModule, HttpClientModule],
  exports: [ChatModule],
  providers: [AdminService, UserService]
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
