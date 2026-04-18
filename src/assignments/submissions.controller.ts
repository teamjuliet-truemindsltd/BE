import { Controller, Post, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto, GradeSubmissionDto } from './dto/submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit work for an assignment' })
  create(@Body() createSubmissionDto: CreateSubmissionDto, @CurrentUser() user: any) {
    return this.submissionsService.create(createSubmissionDto, user.id);
  }

  @Get('instructor/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all submissions for an instructor\'s courses' })
  findInstructorAll(@CurrentUser() user: any) {
    return this.submissionsService.findAllForInstructor(user.id);
  }

  @Get('assignment/:assignmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all submissions for an assignment (Instructor only)' })
  findByAssignment(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.submissionsService.findByAssignment(assignmentId, user.id, isAdmin);
  }

  @Get('my-submissions/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all submissions for the current user' })
  findMyAllSubmissions(@CurrentUser() user: any) {
    return this.submissionsService.findAllForStudent(user.id);
  }

  @Get('my-submission/:assignmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user\'s submission for an assignment' })
  findMySubmission(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    return this.submissionsService.findUserSubmission(assignmentId, user.id);
  }

  @Patch(':id/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grade a submission' })
  grade(@Param('id') id: string, @Body() gradeDto: GradeSubmissionDto, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.submissionsService.grade(id, gradeDto, user.id, isAdmin);
  }
}
