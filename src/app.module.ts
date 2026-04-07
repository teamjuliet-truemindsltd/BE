import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxModule } from './outbox/outbox.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { TeamMembersModule } from './team-members/team-members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_DATABASE', 'lms_db'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
      }),
    }),
    AuthModule,
    UsersModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    OutboxModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    MediaModule,
    DashboardModule,
    AssignmentsModule,
    CollaborationModule,
    TeamMembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
