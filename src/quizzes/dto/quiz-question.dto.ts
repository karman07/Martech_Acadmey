import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  prompt: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  correctOptionIndex: number;
}
