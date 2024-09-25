export class ApplicationEntity<T> {
  constructor(partial: Partial<T>) {
    Object.assign(this, partial);
  }
}
