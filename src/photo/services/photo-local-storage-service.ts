import {
  FileSystemStoredFile,
  FormDataInterceptorConfig,
  NestjsFormDataConfigFactory,
} from 'nestjs-form-data';

export class PhotoLocalStorageConfigService
  implements NestjsFormDataConfigFactory
{
  configAsync():
    | Promise<FormDataInterceptorConfig>
    | FormDataInterceptorConfig {
    return {
      storage: FileSystemStoredFile,
      fileSystemStoragePath: '/tmp/purepixel-local-storage',
    };
  }
}
