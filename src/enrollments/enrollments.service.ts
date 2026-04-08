import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CoursesService } from '../courses/courses.service';
import { LessonsService } from '../lessons/lessons.service';
import { randomUUID } from 'crypto';
import { Lesson } from '../lessons/entities/lesson.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepository: Repository<LessonProgress>,
    private coursesService: CoursesService,
    private lessonsService: LessonsService,
  ) {}

  async enrollUser(userId: number, courseId: string): Promise<Enrollment> {
    await this.coursesService.findOne(courseId);

    const existing = await this.enrollmentRepository.findOne({
      where: { userId, courseId }
    });

    if (existing) {
      throw new BadRequestException('User is already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      userId,
      courseId,
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  async getUserEnrollments(userId: number): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
    });
  }

  async findEnrollmentOrThrow(userId: number, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId }
    });
    if (!enrollment) throw new NotFoundException('You must enroll in this course first');
    return enrollment;
  }

  async markLessonComplete(userId: number, lessonId: string): Promise<any> {
    const lesson = await this.lessonsService.findOne(lessonId, userId);
    if (!lesson.module) {
        throw new NotFoundException('Lesson module not found');
    }
    const moduleId = lesson.moduleId;
    const courseModule = await this.coursesService.findModuleById(moduleId);
    const courseId = courseModule.courseId;

    const enrollment = await this.findEnrollmentOrThrow(userId, courseId);

    const existingProgress = await this.lessonProgressRepository.findOne({
      where: { userId, lessonId }
    });

    if (existingProgress) {
      return { message: 'Lesson already completed', progress: enrollment.progressPercentage };
    }

    const progress = this.lessonProgressRepository.create({
      userId,
      lessonId,
      isCompleted: true,
    });
    await this.lessonProgressRepository.save(progress);

    // Calculate total lessons in course
    const totalLessons = await this.lessonProgressRepository.manager
      .createQueryBuilder(Lesson, 'lesson')
      .innerJoin('lesson.module', 'module')
      .where('module.courseId = :courseId', { courseId })
      .getCount();

    if (totalLessons === 0) return { message: 'Completed', progress: 100 };

    // Calculate total completed lessons in course for this user
    const totalCompleted = await this.lessonProgressRepository.createQueryBuilder('lp')
      .innerJoin('lp.lesson', 'lesson')
      .innerJoin('lesson.module', 'module')
      .where('lp.userId = :userId', { userId })
      .andWhere('module.courseId = :courseId', { courseId })
      .getCount();

    const percentage = parseFloat(((totalCompleted / totalLessons) * 100).toFixed(2));
    
    enrollment.progressPercentage = percentage;

    if (percentage === 100 && !enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
      enrollment.certificateId = randomUUID();
    }

    await this.enrollmentRepository.save(enrollment);

    return {
      message: 'Lesson marked complete',
      lessonId,
      courseProgress: percentage
    };
  }

  async countAll() {
    return await this.enrollmentRepository.count();
  }

  async countByInstructor(instructorId: number) {
    return await this.enrollmentRepository.createQueryBuilder('enrollment')
      .innerJoin('enrollment.course', 'course')
      .where('course.instructorId = :instructorId', { instructorId })
      .getCount();
  }

  async countUniqueStudentsByInstructor(instructorId: number) {
    const result = await this.enrollmentRepository.createQueryBuilder('enrollment')
      .select('COUNT(DISTINCT enrollment.userId)', 'count')
      .innerJoin('enrollment.course', 'course')
      .where('course.instructorId = :instructorId', { instructorId })
      .getRawOne();
    return parseInt(result.count, 10) || 0;
  }

  async getMostPopularCourseByInstructor(instructorId: number) {
    return await this.enrollmentRepository.createQueryBuilder('enrollment')
      .select('course.title', 'title')
      .addSelect('COUNT(enrollment.id)', 'enrollmentCount')
      .innerJoin('enrollment.course', 'course')
      .where('course.instructorId = :instructorId', { instructorId })
      .groupBy('course.id')
      .orderBy('enrollmentCount', 'DESC')
      .limit(1)
      .getRawOne();
  }
}
