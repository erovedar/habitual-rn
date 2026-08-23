// Thrown from routes/middleware; errorHandler reads .status/.publicMessage.
export class HttpError extends Error {
  status: number;
  publicMessage: string;

  constructor(status: number, publicMessage: string) {
    super(publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}
