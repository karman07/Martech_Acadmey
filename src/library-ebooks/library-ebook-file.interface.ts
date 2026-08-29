/**
 * Shape the library-ebooks service actually needs from an uploaded file.
 * Deliberately not `Express.Multer.File` — Multer's type is a structural
 * superset of this, so swapping the upload middleware later doesn't require
 * touching the service.
 */
export interface UploadedLibraryEbookFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
