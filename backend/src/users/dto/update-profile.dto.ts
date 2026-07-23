import { IsDateString, IsIn, IsOptional, IsString, IsUrl, Length, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  // ISO 3166-1 alpha-2 code. Unlimited changes, unlike gender.
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
