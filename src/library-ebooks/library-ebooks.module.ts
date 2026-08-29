import { Module } from '@nestjs/common';
import { LibraryEbooksController } from './library-ebooks.controller';
import { LibraryEbooksService } from './library-ebooks.service';
import { LIBRARY_EBOOK_STORAGE } from './library-ebook-storage.interface';
import { LocalDiskLibraryEbookStorage } from './local-disk-library-ebook.storage';

@Module({
  controllers: [LibraryEbooksController],
  providers: [
    LibraryEbooksService,
    { provide: LIBRARY_EBOOK_STORAGE, useClass: LocalDiskLibraryEbookStorage },
  ],
})
export class LibraryEbooksModule {}
