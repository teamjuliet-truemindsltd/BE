import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CoursesService } from '../courses/courses.service';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepository: Repository<LessonProgress>,
    private coursesService: CoursesService
  ) {}

  async create(createLessonDto: CreateLessonDto, moduleId: string, userId: number, isAdmin: boolean): Promise<Lesson> {
    // Validate module exists and check ownership
    const module = await this.coursesService.findModuleById(moduleId);
    const course = await this.coursesService.findOne(module.courseId);
    
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only add lessons to your own courses');
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      moduleId,
    });
    
    return await this.lessonRepository.save(lesson);
  }

  async findOne(id: string, userId?: number): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['module'], // Bring module data if needed
    });
    
    if (!lesson) throw new NotFoundException('Lesson not found');

    const isAuthorized = await this.coursesService.hasAccess(lesson.module.courseId, userId);
    if (!isAuthorized) {
      throw new UnauthorizedException('Please enroll in the course to view this lesson');
    }

    const result = { ...lesson } as any;

    if (userId) {
      const progress = await this.lessonProgressRepository.findOne({
        where: { lessonId: id, userId }
      });
      result.isCompleted = !!progress?.isCompleted;
    }

    return result;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto, userId: number, isAdmin: boolean): Promise<Lesson> {
    const lesson = await this.findOne(id);
    const course = await this.coursesService.findOne(lesson.module.courseId);

    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only update lessons in your own courses');
    }

    Object.assign(lesson, updateLessonDto);
    return await this.lessonRepository.save(lesson);
  }

  async remove(id: string, userId: number, isAdmin: boolean): Promise<void> {
    const lesson = await this.findOne(id);
    const course = await this.coursesService.findOne(lesson.module.courseId);

    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only remove lessons from your own courses');
    }

    await this.lessonRepository.remove(lesson);
  }

  async findAllByModule(moduleId: string, userId?: number): Promise<Lesson[]> {
    const module = await this.coursesService.findModuleById(moduleId);
    const isAuthorized = await this.coursesService.hasAccess(module.courseId, userId);

    if (!isAuthorized) {
      return []; // Return empty lessons if not enrolled
    }

    return await this.lessonRepository.find({
      where: { moduleId },
      order: { order: 'ASC' },
      relations: ['module'],
    });
  }
}
