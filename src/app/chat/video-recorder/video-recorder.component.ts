import { Component, OnInit, OnDestroy, ElementRef, EventEmitter, Output } from '@angular/core';
import { UploadAwsService } from '../../services/upload-aws.service';
import videojs from 'video.js';
import * as Record from 'videojs-record/dist/videojs.record.js';
import * as gifshot from '../../../assets/library/gifshot.js';
import { VideoThumbnailService } from 'app/services/video-thumbnail.service';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss']
})
export class VideoRecorderComponent implements OnInit, OnDestroy {

  public _elementRef: ElementRef

  public config: any;
  public player: any;
  public plugin: any;
  public showSaveButton: boolean = false;
  public startCount: number = 3;
  public deviceReady: boolean = false;
  public showCounter: boolean = false;
  public stopRecordButton: boolean = false;

  @Output() saved: EventEmitter<any> = new EventEmitter();
  public showPlaybutton: boolean;
  public showRecordAgainButton: boolean;
  public showProgressBar: boolean;
  public videoUploaded: boolean;
  constructor(elementRef: ElementRef, private uploadAwsService: UploadAwsService, private videoThumbnailService: VideoThumbnailService) {
    this.player = false;
    this.plugin = Record;
    this.config = {
      plugins: {
        record: {
          audio: true,
          video: true,
          debug: true,
          maxLength: 3000,
          videoMimeType: 'video/webm;codecs=H264',
        },
      }
    };
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.player = videojs(document.getElementById('intro-record'), this.config, () => { });
    let element: HTMLElement = document.querySelectorAll("[title='Device']")[0] as HTMLElement;
    element.click();
    element.remove();
    this.player.on('deviceReady', () => {
      this.deviceReady = true;
    });

    this.player.on('startRecord', () => {
    });
    this.player.on('pause', () => {
      this.showPlaybutton = true;
    });
    this.player.on('finishRecord', () => {
      this.showSaveButton = true;
      this.showRecordAgainButton = true;
      this.showPlaybutton = true;
      this.stopRecordButton = false;
    });

    this.player.on('error', (element, error) => {
      console.warn(error);
    });

    this.player.on('deviceError', () => {
      console.error('device error:', this.player.deviceErrorCode);
    });
  }
  ngOnDestroy() {
    if (this.player) {
      this.player.dispose();
      this.player = false;
    }
  }
  generateGif(obj) {
    if (!obj.error) {
      var image = obj.image;
      var binary_string = window.atob(image.replace(/^data:image\/\w+;base64,/, ""));
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      this.uploadAwsService.fileUpload(bytes.buffer, this.player.recordedData.name.split(".")[0] + '.gif', 'image/gif');
      this.showProgressBar = false;
      this.showRecordAgainButton = true;
      this.videoUploaded = true;
    }
  }
  clickNext() {
    this.saved.emit("https://fiapps.s3.ca-central-1.amazonaws.com/Intros/"+this.player.recordedData.name);
  }
  saveVideo() {
    this.showSaveButton = false;
    this.showRecordAgainButton = false;
    this.showProgressBar = true;
    this.uploadAwsService.fileUpload(this.player.recordedData, this.player.recordedData.name, this.player.recordedData.type);
    this.videoThumbnailService.generateThumbnail(this.player.recordedData).then(thumbnailData => {
      var binary_string = window.atob(thumbnailData.replace(/^data:image\/\w+;base64,/, ""));
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      this.uploadAwsService.fileUpload(bytes.buffer, this.player.recordedData.name.split(".")[0] + '.png', 'image/png');
    });
    gifshot.createGIF({
      gifWidth: 640,
      gifHeight: 450,
      video: [
        this.player.recordedData
      ],
      interval: 0.1,
      numFrames: 20,
      frameDuration: 1,
      fontWeight: 'normal',
      fontSize: '16px',
      fontFamily: 'sans-serif',
      fontColor: '#ffffff',
      textAlign: 'center',
      textBaseline: 'bottom',
      sampleInterval: 10,
      numWorkers: 2
    }, this.generateGif.bind(this));
  }

  startcounter() {
    var that = this;
    that.showCounter = true;
    this.showPlaybutton = false;
    this.showSaveButton = false;
    this.showRecordAgainButton = false;
    that.startCount = 3;
    var stop = setInterval(function () {
      that.startCount = that.startCount - 1;
      if (that.startCount === 0) {
        clearInterval(stop);
        that.showCounter = false;
        that.deviceReady = false;
        that.stopRecordButton = true;
        that.player.record().start();
      }
    }, 1000);
  };
  stopRecord() {
    this.player.record().stop();
  };
  playVideo() {
    this.showPlaybutton = false;
    this.player.play();
  };
}