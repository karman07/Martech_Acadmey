import { IsObject } from 'class-validator';

/** The instructor bundle (instructor + courses + ebooks + bootcamps + posts + ...) the frontend already
 * assembled via loadInstructorBundle() — passed through as-is and interpolated into the template. */
export class RenderPageTemplateDto {
  @IsObject()
  instructorData: Record<string, unknown>;
}
