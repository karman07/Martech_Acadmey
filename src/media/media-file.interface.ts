/**
 * Shape the media service actually needs from an uploaded file.
 * Deliberately not `Express.Multer.File` — Multer's type is a structural
 * superset of this, so swapping the upload middleware later (e.g. a
 * different multipart parser) doesn't require touching the service.
 */
export interface UploadedMediaFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
