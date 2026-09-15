export class Constants {
  static PHOTOGRAPHER_ROLE = 'photographer';
  static CUSTOMER_ROLE = 'customer';
  static MANAGER_ROLE = 'manager';
  static ADMIN_ROLE = 'purepixel-admin';

  //default images live in the public bucket under default/
  static DEFAULT_AVATAR = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_PUBLIC_BUCKET}/default/default-avatar.png`;

  static DEFAULT_IMAGE = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_PUBLIC_BUCKET}/default/default-camera.png`;

  static DEFAULT_COVER = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_PUBLIC_BUCKET}/default/cover.png`;

  static SORT = ['asc', 'desc'];
}
