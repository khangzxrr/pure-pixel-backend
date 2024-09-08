import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { SftpFailedCreateUser } from '../exceptions/sftpFailedCreateUser.exception';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class SftpService {
  private logger = new Logger(SftpService.name);

  constructor(private readonly httpService: HttpService) {}
  async registerNewSftpUser(
    userid: string,
    username: string,
    email: string,
    password: string,
  ) {
    await lastValueFrom(
      this.httpService
        .post(
          `${process.env.SFTPGO_ENDPOINT}/api/v2/users`,
          {
            status: 1,
            username: username,
            email: email,
            description: '',
            expiration_date: 0,
            password: password,
            public_keys: [],
            has_password: true,
            home_dir: `/temp/sftpgo/${userid}`,
            virtual_folders: [],
            uid: 0,
            gid: 0,
            max_sessions: 0,
            quota_size: 5368709120,
            quota_files: 0,
            permissions: {
              '/': ['*'],
            },
            used_quota_size: 0,
            used_quota_files: 0,
            last_quota_update: 0,
            upload_bandwidth: 0,
            download_bandwidth: 0,
            upload_data_transfer: 0,
            download_data_transfer: 0,
            total_data_transfer: 0,
            used_upload_data_transfer: 0,
            used_download_data_transfer: 0,
            filters: {},
            filesystem: {
              provider: 1,
              osconfig: {},
              s3config: {
                bucket: process.env.S3_BUCKET,
                key_prefix: `${userid}/`,
                region: process.env.S3_REGION,
                access_key: process.env.S3_ACCESS_KEY_ID,
                access_secret: {
                  status: 'Plain',
                  payload: process.env.S3_SECRET_ACCESS_KEY,
                  additional_data: userid,
                },
                endpoint: process.env.S3_URL,
                storage_class: '',
                acl: '',
                upload_part_size: 0,
                upload_concurrency: 0,
                upload_part_max_time: 0,
                download_part_size: 0,
                download_concurrency: 0,
                download_part_max_time: 0,
                force_path_style: false,
              },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-SFTPGO-API-KEY': process.env.SFTPGO_API_KEY,
            },
          },
        )
        .pipe(
          map((response) => {
            console.log(response.status);
            return response.data;
          }),
          catchError((e) => {
            console.log(e);
            throw new SftpFailedCreateUser(e.response.data);
          }),
        ),
    );
  }
}
