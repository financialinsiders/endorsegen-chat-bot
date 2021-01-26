import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { AdminService } from 'app/services/admin-service';
import * as CronofyElements from "cronofy-elements";
@Component({
  selector: 'app-cronofy',
  templateUrl: './cronofy.component.html',
  styleUrls: ['./cronofy.component.scss']
})
export class CronofyComponent implements OnInit {
  @Input() instanceId: number;
  @Input() email: string;
  @Input() name: string;
  @Input() botId: number;
  startDate: any;
  startTime: any;
  endTime: any;
  isBusy: boolean;
  leadId: any;
  meetingBooked: { startDate: any; endTime: any; startTime: any; };
  meetingID: string;
  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    var urlParams = new URLSearchParams(window.location.search);
    this.meetingID = urlParams.get('meetingID');
    this.adminService.getElementID(this.instanceId).subscribe(data => {
      this.adminService.getAvailableSlots(this.instanceId).subscribe(availableSlots => {
        CronofyElements.SlotPicker({
          element_token: data['element_token'].token,
          target_id: "cronofy-slot-picker",
          tzid: "America/Vancouver",
          availability_query: {
            participants: [
              {
                required: "all",
                members: [
                  { sub: data['element_token'].subs[0] }
                ]
              }
            ],
            required_duration: { minutes: parseInt(availableSlots['required_duration']) },
            query_periods: availableSlots['query_periods']
          },
          styles: {
            prefix: "custom-name"
          },
          callback: notification => {
            this.isBusy = true;
            this.formatDateTime(notification.notification.slot);
            var meetingRequest = {
              agent_id: this.instanceId,
              lead_id: this.leadId,
              endorser_id: this.instanceId,
              meeting_date_time: notification.notification.slot.start,
              meeting_end_datetime: notification.notification.slot.end,
              email: this.email,
              bot_id: this.botId,
            }

            this.adminService.createAppointmentMeeting(meetingRequest).subscribe(data =>{
              this.createApoinment(data['meeting_id'], notification, data['user_id']);
            });
          }
        });
      });
    });
  }
  formatDateTime(slotObject) {
    var dateTimeObject = slotObject.start.split('T');
    this.startDate = dateTimeObject[0];
    this.startTime = this.timeConvert(dateTimeObject[1].substring(0, dateTimeObject[1].length - 1));
    var enddateTimeObject = slotObject.end.split('T');
    this.endTime = this.timeConvert(enddateTimeObject[1].substring(0, enddateTimeObject[1].length - 1));
  }

  timeConvert(time) {
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {
      time = time.slice(1);
      time[5] = +time[0] < 12 ? 'AM' : 'PM';
      time[0] = +time[0] % 12 || 12;
    }
    return time.join('');
  }
  createApoinment(meetingId, notification, userID) {
    var requestBosy = {
      "agentID": this.instanceId,
      "event_id": meetingId,
      "start": notification.notification.slot.start,
      "end": notification.notification.slot.end,
      "participant_email": this.email,
      "participant_name": this.name,
      "meeting_url": 'https://financialinsiders.ca/terry-thomas/meeting/?id=' + userID
    }
    this.adminService.bookSlot(requestBosy).subscribe(function (slotData) {
      var updateMeetingEvent = {
        "event_id": meetingId,
        "id": meetingId
      }
    });
    this.meetingBooked = { startDate: this.startDate, endTime: this.endTime, startTime: this.startTime };
    //updateAppointment(this.meetingBooked);
  }
}
