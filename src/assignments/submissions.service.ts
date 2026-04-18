import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { Assignment } from './entities/assignment.entity';
import { CreateSubmissionDto, GradeSubmissionDto } from './dto/submission.dto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto, userId: number): Promise<Submission> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: createSubmissionDto.assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const existing = await this.submissionRepository.findOne({
      where: { userId, assignmentId: assignment.id },
    });

    if (existing) {
        // Update existing submission if already submitted
        existing.contentUrl = createSubmissionDto.contentUrl;
        existing.status = SubmissionStatus.SUBMITTED;
        return this.submissionRepository.save(existing);
    }

    const submission = this.submissionRepository.create({
      ...createSubmissionDto,
      userId,
      status: SubmissionStatus.SUBMITTED,
    });
    return this.submissionRepository.save(submission);
  }

  async findByAssignment(assignmentId: string, userId: number, isAdmin: boolean): Promise<Submission[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const course = await this.coursesService.findOne(assignment.courseId);
    
    // Only instructor or admin can see all submissions
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    return this.submissionRepository.find({
      where: { assignmentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForInstructor(instructorId: number): Promise<Submission[]> {
    return this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoinAndSelect('submission.assignment', 'assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .where('course.instructorId = :instructorId', { instructorId })
      .orderBy('submission.createdAt', 'DESC')
      .getMany();
  }

  async findAllForStudent(userId: number): Promise<Submission[]> {
    return this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoinAndSelect('submission.assignment', 'assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .where('submission.userId = :userId', { userId })
      .orderBy('submission.createdAt', 'DESC')
      .getMany();
  }

  async findUserSubmission(assignmentId: string, userId: number): Promise<Submission | null> {
    return this.submissionRepository.findOne({
      where: { assignmentId, userId },
    });
  }

  async grade(submissionId: string, gradeDto: GradeSubmissionDto, userId: number, isAdmin: boolean): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment'],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const course = await this.coursesService.findOne(submission.assignment.courseId);

    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only grade submissions for your own courses');
    }

    if (gradeDto.grade > submission.assignment.points) {
        throw new BadRequestException(`Grade (${gradeDto.grade}) cannot exceed max points (${submission.assignment.points})`);
    }

    submission.grade = gradeDto.grade;
    submission.feedback = gradeDto.feedback ?? null;
    submission.status = SubmissionStatus.GRADED;

    return this.submissionRepository.save(submission);
  }
}
