import { IsString, MinLength } from 'class-validator';

export class AddRecordingDto {
  @IsString()
  @MinLength(4)
  recordingUrl: string;
}
