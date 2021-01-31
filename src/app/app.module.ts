import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule } from '@angular/core'

import { ElementModule } from './element.module'
import { AppComponent } from './app.component'
import { HttpClientModule } from '@angular/common/http';
import { AdminService } from './services/admin-service';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'environments/environment.prod';
import { UserService } from './services/user.service';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, ElementModule, HttpClientModule, AngularFireModule.initializeApp(environment.firebaseConfig), MatStepperModule, MatExpansionModule, FormsModule, FormsModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [AdminService, UserService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
