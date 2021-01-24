import { Component, ElementRef, AfterViewInit, ViewChild, Input } from '@angular/core';
import { OpentokService } from 'app/services/opentok.service';

@Component({
  selector: 'app-publisher',
  templateUrl: './publisher.component.html',
  styleUrls: ['./publisher.component.scss']
})

export class PublisherComponent implements AfterViewInit {
  @ViewChild('publisherDiv') publisherDiv: ElementRef;
  @Input() session: OT.Session;
  publisher: OT.Publisher;
  publishing: Boolean = false;

  constructor(private opentokService: OpentokService) {
  }

  ngAfterViewInit() {
    const OT = this.opentokService.getOT();


    if (this.session) {
      if (this.session['isConnected']()) {
        this.session.unpublish(this.publisher)
      }
      //this.session.on('sessionConnected', () => this.publish());
      this.session.on("signal:USRVID", (event) => {
        console.info("Signal sent from connection " + event);
        console.log(event['data']);
        if (event['data']) {
          if (event['data']['enableVideo'] && !this.publishing) {
            this.publish();
          } else if (this.publishing) {
            this.publishing = false;
            this.session.unpublish(this.publisher);
          }

        }
      });
    }
  }

  publish() {
    this.publisher = OT.initPublisher(this.publisherDiv.nativeElement, { insertMode: 'append' });
    this.session.publish(this.publisher, (err) => {
      if (err) {
        alert(err.message);
      } else {
        this.publishing = true;
      }
    });
  }

}
