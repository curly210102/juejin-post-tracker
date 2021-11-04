export class RequestError extends Error {
  text: string;
  constructor(message: string, text?: string) {
    super(message);
    this.text = text ?? message;
  }
}
