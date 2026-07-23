import { IsString, MaxLength } from 'class-validator';

export class ScanFrameDto {
  @IsString()
  sessionId!: string;

  // Downscaled JPEG frame as base64 (no data: prefix). The client keeps frames
  // small (~320px wide, q=0.5) so payloads stay under the JSON body limit.
  @IsString()
  @MaxLength(200_000)
  frame!: string;
}
