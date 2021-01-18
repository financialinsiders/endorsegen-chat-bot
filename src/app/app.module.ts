import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule } from '@angular/core'

import { ElementModule } from './element.module'
import { AppComponent } from './app.component'
import { HttpClientModule } from '@angular/common/http';
import { AdminService } from './services/admin-service';
import { RouterModule, Routes } from '@angular/router';
@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, ElementModule, HttpClientModule, RouterModule.forRoot([])],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [AdminService]
})
export class AppModule {}
