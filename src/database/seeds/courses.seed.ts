import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';
import { Module as CourseModule } from '../../courses/entities/module.entity';
import { Lesson, ContentType } from '../../lessons/entities/lesson.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

async function bootstrap() {
  console.log('Starting comprehensive course seeder (Courses, Modules, Lessons)...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const courseRepo = app.get<Repository<Course>>(getRepositoryToken(Course));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const moduleRepo = app.get<Repository<CourseModule>>(getRepositoryToken(CourseModule));
  const lessonRepo = app.get<Repository<Lesson>>(getRepositoryToken(Lesson));

  // 1. Find or create instructor
  let instructor = await userRepo.findOne({
    where: [{ role: UserRole.ADMIN }, { role: UserRole.INSTRUCTOR }],
  });

  if (!instructor) {
    console.log('No instructor found. Creating a default instructor...');
    instructor = await userRepo.save({
      firstName: 'Default',
      lastName: 'Instructor',
      email: 'instructor@talentflow.io',
      password: 'password123',
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true,
    });
  }

  const coursesData = [
    { title: 'Full Stack Web Development with React & Node.js', description: 'Master the art of building modern web applications from scratch.' },
    { title: 'Advanced Data Science with Python', description: 'Deep dive into machine learning, data visualization, and statistical analysis.' },
    { title: 'UI/UX Design Masterclass', description: 'Learn to design beautiful, user-centric interfaces using Figma and Adobe XD.' },
    { title: 'Digital Marketing Excellence', description: 'Strategic approach to SEO, SEM, and social media marketing for brands.' },
    { title: 'Cybersecurity Fundamentals', description: 'Protect systems and networks from digital attacks in this comprehensive course.' },
    { title: 'Blockchain and Smart Contracts', description: 'Understanding decentralized technology and building smart contracts on Ethereum.' },
    { title: 'Python for Beginners', description: 'Start your coding journey with the most versatile programming language.' },
    { title: 'Product Management Essentials', description: 'Learn how to lead product development from ideation to launch.' },
    { title: 'Graphic Design Basics', description: 'Master the fundamental principles of design and typography.' },
    { title: 'Virtual Assistant Professional', description: 'Scale your career as a remote executive assistant with core skills.' },
    { title: 'Cloud Computing with AWS', description: 'Architect and deploy scalable applications on Amazon Web Services.' },
    { title: 'Agile Project Management', description: 'Drive efficiency and innovation using Scrum and Kanban methodologies.' },
    { title: 'Mobile App Development with Flutter', description: 'Build beautiful native apps for iOS and Android with a single codebase.' },
    { title: 'Introduction to Artificial Intelligence', description: 'Explore the basics of AI, neural networks, and deep learning.' },
    { title: 'Content Writing and Copywriting', description: 'Craft compelling stories and high-converting copy for the web.' },
    { title: 'Business Strategy and Analysis', description: 'Develop critical thinking and strategic planning skills for modern business.' },
    { title: 'Ethical Hacking and Penetration Testing', description: 'Learn to think like a hacker to better secure your organization.' },
    { title: 'Financial Modeling for Startups', description: 'Master Excel and financial planning for growing businesses.' },
    { title: 'Search Engine Optimization (SEO)', description: 'Technical and on-page strategies to dominate search results.' },
    { title: 'DevOps Engineering Path', description: 'Automate deployments and manage infrastructure as code.' },
    { title: 'Machine Learning with R', description: 'Statistical modeling and predictive analytics using R.' },
    { title: 'User Research Methods', description: 'Direct user feedback into actionable product design decisions.' },
    { title: 'Social Media Management Mastery', description: 'Build and engage communities across all major platforms.' },
    { title: 'Sales and Negotiation Skills', description: 'Close more deals with proven communication and sales strategies.' },
    { title: 'Java Programming Deep Dive', description: 'Enterprise-grade programming with Java and Spring Boot.' },
    { title: 'Data Structures and Algorithms', description: 'Master the fundamentals of computer science for technical interviews.' },
    { title: 'Photography and Visual Storytelling', description: 'Capture stunning images and tell powerful stories with your camera.' },
    { title: 'Public Speaking and Presentation', description: 'Command the room and deliver memorable presentations with confidence.' },
    { title: 'Emotional Intelligence at Work', description: 'Develop self-awareness and lead better teams through empathy.' },
    { title: 'Time Management and Productivity', description: 'Optimize your workflow and achieve your goals faster than ever.' },
  ];

  for (const data of coursesData) {
    let course = await courseRepo.findOne({ where: { title: data.title } });
    if (!course) {
      course = courseRepo.create({
        ...data,
        instructorId: instructor.id,
        isPublished: true,
      });
      course = await courseRepo.save(course);
      console.log(`Created course: ${course.title}`);

      // Create Modules for each course
      for (let m = 1; m <= 3; m++) {
        const module = await moduleRepo.save(moduleRepo.create({
          title: `Module ${m}: Getting Started`,
          courseId: course.id,
          order: m,
        }));
        console.log(`  - Created Module: ${module.title}`);

        // Create Lessons for each module
        for (let l = 1; l <= 3; l++) {
          await lessonRepo.save(lessonRepo.create({
            title: `Lesson ${l}: Introduction and Core Concepts`,
            moduleId: module.id,
            order: l,
            contentType: ContentType.TEXT,
            contentUrl: 'https://example.com/lesson-content',
          }));
          console.log(`    * Created Lesson: Lesson ${l}`);
        }
      }
    } else {
      console.log(`Course already exists: ${course.title}`);
    }
  }

  await app.close();
  console.log('Seeding completed successfully!');
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
