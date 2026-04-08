import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private moduleRepository: Repository<CourseModule>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createCourseDto: CreateCourseDto, instructorId: number): Promise<Course> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      instructorId,
    });
    return await this.courseRepository.save(course);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    onlyPublished: boolean = true
  ) {
    const [courses, total] = await this.courseRepository.findAndCount({
      where: {
        ...(onlyPublished ? { isPublished: true } : {}),
        ...(search ? { title: Like(`%${search}%`) } : {}),
      },
      relations: ['instructor'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByInstructor(instructorId: number): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { instructorId: Number(instructorId) },
      order: { createdAt: 'DESC' },
      relations: ['instructor'],
    });
  }

  async hasAccess(courseId: string, userId?: number): Promise<boolean> {
    if (!userId) return false;
    
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    
    if (Number(course.instructorId) === Number(userId)) return true;
    
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId }
    });
    return !!enrollment;
  }

  async findOne(id: string, userId?: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const isAuthorized = await this.hasAccess(id, userId);

    // If not authorized, redact modules (full details)
    if (!isAuthorized) {
      course.modules = [];
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userId: number, isAdmin: boolean): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);
    
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    return await this.courseRepository.save(course);
  }

  async remove(id: string, userId: number, isAdmin: boolean): Promise<void> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);
    
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only delete your own courses');
    }

    await this.courseRepository.remove(course);
  }

  // --- Module Methods ---

  async addModule(courseId: string, createModuleDto: CreateModuleDto, userId: number, isAdmin: boolean): Promise<CourseModule> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only add modules to your own courses');
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      courseId,
    });

    return await this.moduleRepository.save(module);
  }

  async getModulesForCourse(courseId: string, userId?: number): Promise<CourseModule[]> {
    const course = await this.findOne(courseId, userId);
    
    // If findOne returned empty modules because of lack of auth, we should handle it here too
    // But getModulesForCourse is a separate call usually.
    // If not authorized, return empty or throw? 
    // The user said 'without seeing full details'. 
    // We'll throw Forbidden if they try to fetch modules explicitly but are not enrolled.
    
    let isAuthorized = false;
    if (userId) {
      if (Number(course.instructorId) === Number(userId)) {
        isAuthorized = true;
      } else {
        const enrollment = await this.enrollmentRepository.findOne({
          where: { userId, courseId }
        });
        if (enrollment) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return []; // Return empty modules for guests/non-enrolled
    }
    
    return await this.moduleRepository.find({
      where: { courseId },
      order: { order: 'ASC' },
      relations: ['course'] // Inverse relation if needed
    });
  }

  async updateModule(moduleId: string, updateModuleDto: Partial<CreateModuleDto>, userId: number, isAdmin: boolean): Promise<CourseModule> {
    const module = await this.findModuleById(moduleId);
    const course = await this.findOne(module.courseId);

    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only update modules in your own courses');
    }

    Object.assign(module, updateModuleDto);
    return await this.moduleRepository.save(module);
  }

  async deleteModule(moduleId: string, userId: number, isAdmin: boolean): Promise<void> {
    const module = await this.findModuleById(moduleId);
    const course = await this.findOne(module.courseId);

    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only delete modules in your own courses');
    }

    await this.moduleRepository.remove(module);
  }
  
  async findModuleById(moduleId: string): Promise<CourseModule> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId }
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async countAll() {
    return await this.courseRepository.count();
  }

  async countByInstructor(instructorId: number) {
    return await this.courseRepository.count({ where: { instructorId } });
  }
}
