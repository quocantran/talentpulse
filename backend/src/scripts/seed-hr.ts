import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Job } from '../jobs/entities/job.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { UserCV } from '../usercvs/entities/usercv.entity';
import { Role } from '../decorator/customize';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_DATABASE || 'recruitment_db',
  entities: [User, Company, Job, Application, UserCV],
  synchronize: false,
});

async function runSeed() {
  console.log('--- Đang kết nối Cơ sở dữ liệu PostgreSQL ---');
  await AppDataSource.initialize();
  console.log('✓ Kết nối DB thành công!');

  const userRepo = AppDataSource.getRepository(User);
  const companyRepo = AppDataSource.getRepository(Company);
  const jobRepo = AppDataSource.getRepository(Job);
  const cvRepo = AppDataSource.getRepository(UserCV);
  const appRepo = AppDataSource.getRepository(Application);

  const hashedPassword = bcrypt.hashSync('12345678', bcrypt.genSaltSync(10));

  // 1. Tạo hoặc lấy Công ty Demo
  let company = await companyRepo.findOne({
    where: { name: 'TalentPulse Technology Group' },
  });

  if (!company) {
    company = companyRepo.create({
      name: 'TalentPulse Technology Group',
      taxCode: '0109988776',
      scale: '100-500 nhân sự',
      address: 'Keangnam Landmark 72, Phạm Hùng, Cầu Giấy, Hà Nội',
      description:
        'Tập đoàn công nghệ và giải pháp tuyển dụng nhân sự ứng dụng trí tuệ nhân tạo hàng đầu Việt Nam.',
      logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=200&auto=format&fit=crop&q=60',
      usersFollow: [],
      isActive: true,
      isDeleted: false,
    });
    company = await companyRepo.save(company);
    console.log('✓ Đã tạo công ty demo:', company.name);
  } else {
    company.taxCode = '0109988776';
    company.scale = '100-500 nhân sự';
    company.address = 'Keangnam Landmark 72, Phạm Hùng, Cầu Giấy, Hà Nội';
    company.description =
      'Tập đoàn công nghệ và giải pháp tuyển dụng nhân sự ứng dụng trí tuệ nhân tạo hàng đầu Việt Nam.';
    company.logo = 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=200&auto=format&fit=crop&q=60';
    company.isActive = true;
    company.isDeleted = false;
    company = await companyRepo.save(company);
    console.log('✓ Đã cập nhật công ty demo:', company.name);
  }

  // 2. Tạo hoặc Cập nhật tài khoản HR Verified
  const hrEmail = 'hr@talentpulse.com';
  let hrUser = await userRepo.findOne({ where: { email: hrEmail } });

  if (!hrUser) {
    hrUser = userRepo.create({
      email: hrEmail,
      password: hashedPassword,
      name: 'Trần Quốc An (HR Manager)',
      role: Role.HR,
      gender: 'male',
      age: 28,
      address: 'Cầu Giấy, Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      isApproved: true,
      isLocked: false,
      isDeleted: false,
      company: {
        _id: company._id,
        name: company.name,
        isActive: true,
      },
      createdBy: { _id: 'system', email: 'system@talentpulse.com' },
    });
  } else {
    hrUser.name = 'Trần Quốc An (HR Manager)';
    hrUser.password = hashedPassword;
    hrUser.role = Role.HR;
    hrUser.isApproved = true;
    hrUser.isLocked = false;
    hrUser.isDeleted = false;
    hrUser.company = {
      _id: company._id,
      name: company.name,
      isActive: true,
    };
    hrUser.avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  }

  hrUser = await userRepo.save(hrUser);
  console.log('✓ Đã khởi tạo tài khoản HR verified:', hrUser.email);

  // 3. Tạo các Job Demo cho công ty
  let job1 = await jobRepo.findOne({
    where: { name: 'Senior Fullstack Developer (React & NestJS)' },
  });

  if (!job1) {
    job1 = jobRepo.create({
      name: 'Senior Fullstack Developer (React & NestJS)',
      skills: ['React', 'TypeScript', 'NodeJS', 'NestJS', 'PostgreSQL', 'Docker'],
      company: {
        _id: company._id,
        name: company.name,
        logo: company.logo,
        isActive: true,
      },
      salary: 35000000,
      quantity: 3,
      level: 'SENIOR',
      description:
        'Phát triển các module cốt lõi của nền tảng TalentPulse, thiết kế cơ sở dữ liệu và tối ưu hiệu năng WebSocket.',
      location: 'Hà Nội',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      isDeleted: false,
      createdBy: { _id: hrUser._id, email: hrUser.email },
    });
    job1 = await jobRepo.save(job1);
  }

  let job2 = await jobRepo.findOne({
    where: { name: 'AI / Machine Learning Engineer (Python & NLP)' },
  });

  if (!job2) {
    job2 = jobRepo.create({
      name: 'AI / Machine Learning Engineer (Python & NLP)',
      skills: ['Python', 'PyTorch', 'Transformers', 'FastAPI', 'Elasticsearch'],
      company: {
        _id: company._id,
        name: company.name,
        logo: company.logo,
        isActive: true,
      },
      salary: 40000000,
      quantity: 2,
      level: 'SENIOR',
      description:
        'Nghiên cứu và phát triển thuật toán xếp hạng ứng viên AI Matching, xử lý ngôn ngữ tự nhiên trích xuất thông tin CV.',
      location: 'Hà Nội',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      isDeleted: false,
      createdBy: { _id: hrUser._id, email: hrUser.email },
    });
    job2 = await jobRepo.save(job2);
  }
  console.log('✓ Đã tạo các tin tuyển dụng demo');

  // 4. Tạo các Ứng viên và Hồ sơ ứng tuyển Demo
  const candidatesData = [
    {
      name: 'Nguyễn Văn Tuấn',
      email: 'tuan.nguyen.dev@gmail.com',
      skills: ['React', 'TypeScript', 'NodeJS'],
      status: ApplicationStatus.PENDING,
      job: job1,
      coverLetter:
        'Em có 4 năm kinh nghiệm làm việc với React và NestJS, rất mong muốn được thử sức tại TalentPulse.',
    },
    {
      name: 'Trần Thị Mai',
      email: 'mai.tran.ai@gmail.com',
      skills: ['Python', 'PyTorch', 'Transformers', 'FastAPI'],
      status: ApplicationStatus.REVIEWING,
      job: job2,
      coverLetter:
        'Tôi từng tham gia phát triển các mô hình NLP phân loại văn bản và xử lý ngôn ngữ tiếng Việt.',
    },
    {
      name: 'Lê Hoàng Long',
      email: 'long.le.fullstack@gmail.com',
      skills: ['React', 'NodeJS', 'Docker', 'PostgreSQL'],
      status: ApplicationStatus.APPROVED,
      job: job1,
      coverLetter:
        'Em sẵn sàng tham gia phỏng vấn và trao đổi chuyên sâu về kiến trúc hệ thống phân tán.',
    },
  ];

  for (const cand of candidatesData) {
    let candidateUser = await userRepo.findOne({ where: { email: cand.email } });
    if (!candidateUser) {
      candidateUser = userRepo.create({
        email: cand.email,
        password: hashedPassword,
        name: cand.name,
        role: Role.USER,
        gender: 'male',
        age: 24,
        address: 'Hà Nội',
        isApproved: true,
        isLocked: false,
        isDeleted: false,
      });
      candidateUser = await userRepo.save(candidateUser);
    }

    let cv = await cvRepo.findOne({ where: { userId: candidateUser._id } });
    if (!cv) {
      cv = cvRepo.create({
        title: `CV_${cand.name.replace(/\s+/g, '_')}`,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        userId: candidateUser._id,
        user: candidateUser,
        skills: cand.skills,
        education: ['Đại học Bách Khoa Hà Nội'],
        experience: ['3 năm kinh nghiệm'],
        certificates: ['AWS Certified Developer'],
        isPrimary: true,
        isDeleted: false,
      });
      cv = await cvRepo.save(cv);
    }


    const existingApp = await appRepo.findOne({
      where: { userId: candidateUser._id, jobId: cand.job._id },
    });

    if (!existingApp) {
      const newApp = appRepo.create({
        userId: candidateUser._id,
        user: candidateUser,
        jobId: cand.job._id,
        job: cand.job,
        companyId: company._id,
        company: company,
        cvId: cv._id,
        cv: cv,
        coverLetter: cand.coverLetter,
        status: cand.status,
        history: [
          {
            status: cand.status,
            updatedAt: new Date(),
            updatedBy: { _id: hrUser._id, email: hrUser.email },
          },
        ],
        isDeleted: false,
      });
      await appRepo.save(newApp);
    }
  }

  console.log('✓ Đã tạo các hồ sơ ứng tuyển và ứng viên demo!');
  console.log('\n========================================');
  console.log('🎉 KHỞI TẠO SEED HR THÀNH CÔNG!');
  console.log('========================================');
  console.log('📧 Email đăng nhập HR : hr@talentpulse.com');
  console.log('🔑 Mật khẩu           : 12345678');
  console.log('🏢 Doanh nghiệp       : TalentPulse Technology Group');

  console.log('========================================\n');

  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Lỗi khi chạy seed:', err);
  process.exit(1);
});
