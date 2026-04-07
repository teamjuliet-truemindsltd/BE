import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  profilePicture: string;

  @Column({ length: 100 })
  track: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
