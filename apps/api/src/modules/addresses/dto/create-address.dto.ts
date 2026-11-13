import {
  IsString, IsOptional, IsBoolean, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Priya Meher' })
  @IsString()
  @MaxLength(100)
  recipientName!: string;

  @ApiProperty({ example: '+919876543210' })
  @Matches(/^\+91[6-9]\d{9}$/, { message: 'Must be a valid Indian mobile number' })
  recipientPhone!: string;

  @ApiProperty({ example: 'House No. 42, Ward 7' })
  @IsString()
  @MaxLength(255)
  line1!: string;

  @ApiPropertyOptional({ example: 'Near Samaleswari Temple' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiPropertyOptional({ example: 'Opposite SBI Branch' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @ApiProperty({ example: 'Sambalpur' })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Sambalpur' })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiPropertyOptional({ example: 'Odisha', default: 'Odisha' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ example: '768001' })
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Must be a valid 6-digit Indian PIN code' })
  pinCode!: string;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
