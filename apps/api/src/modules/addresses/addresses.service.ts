import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all addresses for a user, default first.
   */
  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Create a new address.
   * Max 10 per user. If isDefault=true or first address, unset other defaults.
   */
  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) {
      throw new BadRequestException(`Maximum ${MAX_ADDRESSES} addresses allowed`);
    }

    const isFirst = count === 0;
    const shouldBeDefault = dto.isDefault || isFirst;

    return this.prisma.$transaction(async (tx) => {
      // Unset existing default if this one will be default
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          line1: dto.line1,
          line2: dto.line2,
          landmark: dto.landmark,
          city: dto.city,
          district: dto.district,
          state: dto.state ?? 'Odisha',
          pinCode: dto.pinCode,
          label: dto.label,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  /**
   * Update an address. Ownership check enforced.
   * If setting as default, unset others.
   */
  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(dto.recipientName !== undefined && { recipientName: dto.recipientName }),
          ...(dto.recipientPhone !== undefined && { recipientPhone: dto.recipientPhone }),
          ...(dto.line1 !== undefined && { line1: dto.line1 }),
          ...(dto.line2 !== undefined && { line2: dto.line2 }),
          ...(dto.landmark !== undefined && { landmark: dto.landmark }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.district !== undefined && { district: dto.district }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.pinCode !== undefined && { pinCode: dto.pinCode }),
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  /**
   * Delete an address. Ownership check enforced.
   */
  async delete(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.address.delete({ where: { id } });
    return { message: 'Address deleted' };
  }
}
