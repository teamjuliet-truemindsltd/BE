import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateTeamMemberDto, file?: Express.Multer.File): Promise<TeamMember> {
    let profilePicture: string | undefined;

    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      profilePicture = result.secure_url;
    }

    const member = this.teamMemberRepository.create({
      fullName: dto.fullName,
      track: dto.track,
      profilePicture,
    });

    return this.teamMemberRepository.save(member);
  }

  async findAll(): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      select: ['id', 'fullName', 'profilePicture', 'track', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
