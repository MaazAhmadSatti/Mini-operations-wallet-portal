import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../common/pagination.dto';
import { UserStatus } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      email: dto.email.toLowerCase().trim(),
      status: dto.status ?? UserStatus.ACTIVE,
    });

    return this.usersRepository.save(user);
  }

  async findAll(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.search
      ? [
          { name: ILike(`%${query.search}%`) },
          { email: ILike(`%${query.search}%`) },
          { phone: ILike(`%${query.search}%`) },
        ]
      : undefined;

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
