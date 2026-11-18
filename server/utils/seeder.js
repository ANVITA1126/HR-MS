const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Announcement = require('../models/Announcement');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms';
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Attendance.deleteMany(),
      Leave.deleteMany(),
      Payroll.deleteMany(),
      Announcement.deleteMany()
    ]);
    console.log(' Cleared old data.');

    // 1. Create Departments
    const departmentsData = [
      { name: 'Engineering', code: 'ENG', description: 'Software engineering, architecture, and IT infrastructure' },
      { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee relations, and culture' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Financial planning, payroll, audits, and accounts' },
      { name: 'Marketing & Growth', code: 'MKT', description: 'Brand strategy, content, digital marketing, and campaigns' },
      { name: 'Sales & Business', code: 'SAL', description: 'Enterprise client relations and business growth' }
    ];

    const departments = await Department.insertMany(departmentsData);
    console.log(` Created ${departments.length} departments.`);

    const engDept = departments.find(d => d.code === 'ENG');
    const hrDept = departments.find(d => d.code === 'HR');
    const finDept = departments.find(d => d.code === 'FIN');
    const mktDept = departments.find(d => d.code === 'MKT');

    // 2. Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const managerPasswordHash = await bcrypt.hash('manager123', salt);
    const employeePasswordHash = await bcrypt.hash('employee123', salt);

    // 3. Create Users
    const usersData = [
      {
        employeeId: 'EMP-1001',
        name: 'Arnav Sharma',
        email: 'admin@hrms.com',
        password: adminPasswordHash,
        role: 'admin',
        department: hrDept._id,
        designation: 'Head of People & Culture',
        phone: '+91 9876543210',
        gender: 'Male',
        dateOfJoining: new Date('2022-01-10'),
        salary: 120000,
        address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        bankDetails: { accountNumber: '987654321001', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234' },
        leaveBalance: { sick: 10, casual: 12, paid: 15 }
      },
      {
        employeeId: 'EMP-1002',
        name: 'Vikram Malhotra',
        email: 'manager@hrms.com',
        password: managerPasswordHash,
        role: 'manager',
        department: engDept._id,
        designation: 'Engineering Lead',
        phone: '+91 9876543211',
        gender: 'Male',
        dateOfJoining: new Date('2022-03-15'),
        salary: 95000,
        address: { city: 'Pune', state: 'Maharashtra', country: 'India' },
        bankDetails: { accountNumber: '987654321002', bankName: 'ICICI Bank', ifscCode: 'ICIC0005678' },
        leaveBalance: { sick: 9, casual: 11, paid: 14 }
      },
      {
        employeeId: 'EMP-1003',
        name: 'Aanya Gupta',
        email: 'aanya@hrms.com',
        password: employeePasswordHash,
        role: 'employee',
        department: engDept._id,
        designation: 'Senior Full Stack Developer',
        phone: '+91 9876543212',
        gender: 'Female',
        dateOfJoining: new Date('2023-02-01'),
        salary: 75000,
        address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        bankDetails: { accountNumber: '987654321003', bankName: 'State Bank of India', ifscCode: 'SBIN0009999' },
        leaveBalance: { sick: 8, casual: 10, paid: 12 }
      },
      {
        employeeId: 'EMP-1004',
        name: 'Rohan Verma',
        email: 'rohan@hrms.com',
        password: employeePasswordHash,
        role: 'employee',
        department: mktDept._id,
        designation: 'Digital Marketing Strategist',
        phone: '+91 9876543213',
        gender: 'Male',
        dateOfJoining: new Date('2023-06-15'),
        salary: 60000,
        address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        bankDetails: { accountNumber: '987654321004', bankName: 'Axis Bank', ifscCode: 'UTIB0001111' },
        leaveBalance: { sick: 10, casual: 12, paid: 15 }
      },
      {
        employeeId: 'EMP-1005',
        name: 'Pooja Iyer',
        email: 'pooja@hrms.com',
        password: employeePasswordHash,
        role: 'employee',
        department: finDept._id,
        designation: 'Senior Financial Analyst',
        phone: '+91 9876543214',
        gender: 'Female',
        dateOfJoining: new Date('2023-09-01'),
        salary: 68000,
        address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
        bankDetails: { accountNumber: '987654321005', bankName: 'Kotak Mahindra Bank', ifscCode: 'KKBK0002222' },
        leaveBalance: { sick: 10, casual: 11, paid: 13 }
      }
    ];

    const users = await User.insertMany(usersData);
    console.log(` Created ${users.length} sample users.`);

    // Assign Heads of Department
    await Department.findByIdAndUpdate(hrDept._id, { head: users[0]._id });
    await Department.findByIdAndUpdate(engDept._id, { head: users[1]._id });

    // 4. Create Announcements
    const announcementsData = [
      {
        title: ' Annual Performance Appraisals - Q4',
        content: 'The appraisal review cycle for this quarter starts next Monday. Please submit your self-evaluations before the deadline.',
        priority: 'High',
        createdBy: users[0]._id
      },
      {
        title: ' Hackathon 2025: Innovation Weekend',
        content: 'Join our annual 48-hour innovation hackathon with awesome tech gadgets and mentorship awards. Registration is open on the portal.',
        priority: 'Medium',
        createdBy: users[1]._id
      },
      {
        title: ' Updated Wellness & Health Insurance Policy',
        content: 'Our health coverage now includes complimentary mental health subscriptions and dental consultation discounts. Check the benefits guide.',
        priority: 'Low',
        createdBy: users[0]._id
      }
    ];
    await Announcement.insertMany(announcementsData);
    console.log(' Created announcements.');

    // 5. Create Attendance for past 7 days
    const attendanceRecords = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Skip Sunday (0)
      if (d.getDay() === 0) continue;

      for (const u of users) {
        const isLate = Math.random() > 0.8;
        const checkInHour = isLate ? 10 : 9;
        const checkInMinute = Math.floor(Math.random() * 30);

        const checkIn = new Date(d);
        checkIn.setHours(checkInHour, checkInMinute, 0);

        const checkOut = new Date(d);
        checkOut.setHours(18, Math.floor(Math.random() * 45), 0);

        const hours = parseFloat(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));

        attendanceRecords.push({
          employee: u._id,
          date: dateStr,
          checkIn,
          checkOut: i === 0 ? null : checkOut, // today might not be checked out yet
          totalHours: i === 0 ? 4.5 : hours,
          status: isLate ? 'Late' : 'Present',
          notes: isLate ? 'Traffic delay reported' : 'On-time'
        });
      }
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(` Created ${attendanceRecords.length} attendance records.`);

    // 6. Create Leave Applications
    const leavesData = [
      {
        employee: users[2]._id,
        leaveType: 'Casual',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        totalDays: 2,
        reason: 'Attending family function out of town',
        status: 'Pending'
      },
      {
        employee: users[3]._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        totalDays: 2,
        reason: 'Viral fever and doctor consultation',
        status: 'Approved',
        reviewedBy: users[0]._id,
        reviewRemarks: 'Get well soon!',
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        employee: users[4]._id,
        leaveType: 'Paid',
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        totalDays: 3,
        reason: 'Personal vacation',
        status: 'Approved',
        reviewedBy: users[0]._id,
        reviewRemarks: 'Approved',
        reviewedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
      }
    ];
    await Leave.insertMany(leavesData);
    console.log(' Created sample leave requests.');

    // 7. Create Payroll Records
    const payrollsData = [];
    const months = ['October', 'November'];
    const currentYear = new Date().getFullYear();

    for (const m of months) {
      for (const u of users) {
        const basic = u.salary;
        const hra = Math.round(basic * 0.4);
        const conveyance = 1600;
        const medical = 1250;
        const special = Math.round(basic * 0.1);
        const pf = Math.round(basic * 0.12);
        const tax = Math.round(basic * 0.05);

        const totalEarnings = basic + hra + conveyance + medical + special;
        const totalDeductions = pf + tax;
        const netSalary = totalEarnings - totalDeductions;

        payrollsData.push({
          employee: u._id,
          month: m,
          year: currentYear,
          basicSalary: basic,
          allowances: { hra, conveyance, medical, special },
          deductions: { providentFund: pf, tax, other: 0 },
          totalEarnings,
          totalDeductions,
          netSalary,
          paymentStatus: m === 'October' ? 'Paid' : 'Processed',
          paymentDate: m === 'October' ? new Date(`${currentYear}-10-31`) : new Date(),
          remarks: `Standard monthly compensation for ${m} ${currentYear}`
        });
      }
    }
    await Payroll.insertMany(payrollsData);
    console.log(` Created ${payrollsData.length} payroll records.`);

    console.log('\n================ SEEDING COMPLETE ================');
    console.log('Default credentials for testing:');
    console.log(' Admin:    email: admin@hrms.com    password: admin123');
    console.log(' Manager:  email: manager@hrms.com  password: manager123');
    console.log(' Employee: email: aanya@hrms.com    password: employee123');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
