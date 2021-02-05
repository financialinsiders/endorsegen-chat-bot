import { Component, OnInit, Input } from '@angular/core';
import { FacebookApiService } from '../../services/facebook-api.service';
import { IntroductionService } from '../../services/introduction.service';
import { Observable } from 'rxjs';

declare var cloudsponge: any;

@Component({
  selector: 'app-email-sharing',
  templateUrl: './email-sharing.component.html',
  styleUrls: ['./email-sharing.component.scss']
})
export class EmailSharingComponent implements OnInit {
  public invitationContactList: any[] = [];
  public showContactList: boolean = false;
  public usertypedMessage: string;
  public panelOpenState = false;
  public firstName: string;
  public lastName: string;
  public emailAlreadyAdded: boolean;
  public referralEmail: string;
  public emptyUserEmailFeild: boolean = false;
  public emailSelectOption: string;
  public emailPointValue: any;
  @Input() introSessionID: any;
  @Input() endorserId: any;
  @Input() endorserData: any;
  @Input() inviteType: string;
  @Input() isVideoRecorded: boolean;
  @Input() videoFilename: string;
  @Input() userTypedMessage: string;
  @Input() public botId;
  @Input() public instanceId;
  constructor(private facebookApiService: FacebookApiService, private introductionService: IntroductionService) {
  }

  ngOnInit() {
    this.emailPointValue = this.endorserData.intro_email_points;

    cloudsponge.init({
      afterSubmitContacts: this.populateTextarea.bind(this)
    });
  }

  populateTextarea(contacts, source, owner) {
    contacts.forEach(contact => {
      this.invitationContactList.push({ 'first_name': contact.first_name, 'last_name': contact.last_name, 'email': contact.email[0].address });
    });
    this.showContactList = true;
  }
  removeContact = function (index) {
    this.invitationContactList.splice(index, 1);
  };
  cloudSpongeTrigger(type) {
    cloudsponge.launch(type);
  }
  socialShare() {
    var createIntroductionRequestBody = {
      "endorser_id": this.endorserId,
      "extrapoint": "10",
      "bot_id": this.botId,
      "agent_id": this.instanceId,
      "type": 'email',
      "session_id": this.introSessionID,
      "invite_type": this.inviteType,
      "attention_message": this.userTypedMessage,
    };
    if (this.videoFilename) createIntroductionRequestBody['video_url'] = "https://fiapps.s3.ca-central-1.amazonaws.com/Intros/" + this.videoFilename;
    createIntroductionRequestBody['contacts'] = this.invitationContactList;
    this.createLink(createIntroductionRequestBody).subscribe((shareLink: any) => {
      console.log(shareLink.data[0]);
    });
  }
  createLink(createIntroductionRequestBody) {
    return this.introductionService.createIntroduction(createIntroductionRequestBody);
  }
  addManualContact() {
    if (this.invitationContactList.filter((element) => element.email === this.referralEmail).length > 0) {
      this.emailAlreadyAdded = true;
    } else if (this.firstName === undefined || this.lastName === undefined || this.referralEmail === undefined) {
      this.emptyUserEmailFeild = true;
    } else {
      this.emailAlreadyAdded = false;
      this.emptyUserEmailFeild = false;
      this.invitationContactList.push({ 'first_name': this.firstName, 'last_name': this.lastName, 'email': this.referralEmail });
    }
    this.firstName = undefined;
    this.lastName = undefined;
    this.referralEmail = undefined;
  }
}
