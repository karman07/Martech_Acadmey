import { PartialType } from '@nestjs/mapped-types';
import { CreateLibraryEbookDto } from './create-library-ebook.dto';

export class UpdateLibraryEbookDto extends PartialType(CreateLibraryEbookDto) {}
