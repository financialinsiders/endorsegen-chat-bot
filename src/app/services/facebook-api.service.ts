import { Injectable } from '@angular/core';
declare var FB: any;
@Injectable({
  providedIn: 'root'
})
export class FacebookApiService {

  constructor() {

  }
  shareStory(storyUrl) {
    FB.ui(
      {
        method: 'share',
        href: storyUrl,
      }, function (response1) {
      });

  }
}
