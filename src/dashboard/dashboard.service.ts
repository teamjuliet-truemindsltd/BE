import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserRole } from '../common/enums/user-role.enum';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(
    private usersService: UsersService,
    private coursesService: CoursesService,
    private enrollmentsService: EnrollmentsService,
  ) { }

  async getDashboardData(user: JwtPayload) {
    switch (user.role) {
      case UserRole.ADMIN:
        return this.getAdminDashboard();
      case UserRole.INSTRUCTOR:
        return this.getInstructorDashboard(user.sub);
      case UserRole.STUDENT:
      default:
        return this.getStudentDashboard(user.sub);
    }
  }

  private async getAdminDashboard() {
    const [
      totalUsers,
      studentsCount,
      instructorsCount,
      totalCourses,
      totalEnrollments,
      enrollmentTrends,
    ] = await Promise.all([
      this.usersService.countAll(),
      this.usersService.countByRole(UserRole.STUDENT),
      this.usersService.countByRole(UserRole.INSTRUCTOR),
      this.coursesService.countAll(),
      this.enrollmentsService.countAll(),
      this.enrollmentsService.getDailyEnrollmentStats(), // Admin gets global trends
    ]);

    return {
      role: UserRole.ADMIN,
      overview: {
        totalUsers,
        studentsCount,
        instructorsCount,
        totalCourses,
        totalEnrollments,
      },
      enrollmentTrends,
    };
  }

  private async getInstructorDashboard(instructorId: number) {
    const [
      myCoursesCount,
      totalEnrollments,
      uniqueStudentsCount,
      popularCourse,
      enrollmentTrends,
    ] = await Promise.all([
      this.coursesService.countByInstructor(instructorId),
      this.enrollmentsService.countByInstructor(instructorId),
      this.enrollmentsService.countUniqueStudentsByInstructor(instructorId),
      this.enrollmentsService.getMostPopularCourseByInstructor(instructorId),
      this.enrollmentsService.getDailyEnrollmentStats(instructorId), // Instructor gets personal trends
    ]);

    return {
      role: UserRole.INSTRUCTOR,
      stats: {
        activeCourses: myCoursesCount,
        totalEnrollments,
        uniqueStudents: uniqueStudentsCount,
        mostPopularCourse: popularCourse?.title || 'N/A',
      },
      enrollmentTrends,
    };
  }

  private async getStudentDashboard(userId: number) {
    const enrollments = await this.enrollmentsService.getUserEnrollments(userId);

    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => parseFloat(e.progressPercentage.toString()) >= 100).length;

    const sumProgress = enrollments.reduce((acc, curr) => acc + parseFloat(curr.progressPercentage.toString()), 0);
    const averageProgress = totalEnrolled > 0 ? parseFloat((sumProgress / totalEnrolled).toFixed(2)) : 0;

    return {
      role: UserRole.STUDENT,
      stats: {
        totalEnrolled,
        completedCourses,
        averageProgress,
      },
      enrolledCourses: enrollments.slice(0, 5).map(e => ({
        id: e.id,
        courseId: e.courseId,
        title: e.course?.title,
        progress: e.progressPercentage,
        enrolledAt: e.enrolledAt,
      })),
    };
  }
}
