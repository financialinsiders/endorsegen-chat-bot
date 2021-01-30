import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk/global';
import * as S3 from 'aws-sdk/clients/s3';

@Injectable({
  providedIn: 'root'
})
export class UploadAwsService {

  constructor() { }
  fileUpload(file, name, type) {
    const contentType = type;
    const bucket = new S3(
          {
              accessKeyId: 'AKIAI4ZTGWQXPNQWNPAQ',
              secretAccessKey: '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',
              region: 'ca-central-1',
            
          }
      );
      const params = {
          Bucket: 'fiapps',
          Key:  "Intros/" + name,
          Body: file,
          ACL: 'public-read',
          ContentType: contentType
      };
      bucket.upload(params, function (err, data) {
          if (err) {
              console.log('EROOR: ',JSON.stringify( err));
              return false;
          }
          console.log('File Uploaded.', data);
          return true;
      });
    }
}
