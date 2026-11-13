import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Indian mobile number in E.164 format',
    example: '+919876543210',
  })
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone must be a valid Indian mobile number in E.164 format (+91XXXXXXXXXX)',
  })
  phone!: string;
}
