import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson } from './entities/lesson.entity';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, LessonProgress]), CoursesModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
