/**
 * seed.js - `npm run seed`
 * Creates (idempotently): an admin account, 8 departments and 12 doctors
 * with realistic weekly schedules. Doctors have no photos — the frontend
 * shows initials until you upload images from the admin panel.
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const logger = require('../utils/logger');
const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

const DEPARTMENTS = [
  { name: 'Cardiology', icon: 'heart-pulse', shortDescription: 'Heart and vascular care, from prevention to advanced procedures.', services: ['ECG and stress testing', 'Echocardiography', 'Angiography and angioplasty', 'Cardiac rehabilitation'] },
  { name: 'Neurology', icon: 'brain', shortDescription: 'Diagnosis and treatment of brain, spine and nerve conditions.', services: ['EEG and EMG studies', 'Stroke care', 'Epilepsy management', 'Headache and migraine clinic'] },
  { name: 'Orthopedics', icon: 'bone', shortDescription: 'Bone, joint and sports-injury care, including joint replacement.', services: ['Joint replacement', 'Arthroscopy', 'Fracture care', 'Sports medicine'] },
  { name: 'Pediatrics', icon: 'baby', shortDescription: 'Complete healthcare for newborns, children and adolescents.', services: ['Well-baby checkups', 'Vaccinations', 'Growth and development', 'Pediatric emergency care'] },
  { name: 'Gynecology & Obstetrics', icon: 'heart-handshake', shortDescription: 'Women\'s health, pregnancy care and safe deliveries.', services: ['Antenatal care', 'Normal and cesarean delivery', 'Fertility counselling', 'Menopause care'] },
  { name: 'Dermatology', icon: 'scan-face', shortDescription: 'Skin, hair and nail conditions, medical and cosmetic.', services: ['Acne and skin allergy', 'Hair loss treatment', 'Laser procedures', 'Skin biopsy'] },
  { name: 'General Medicine', icon: 'stethoscope', shortDescription: 'First point of care for everyday and long-term conditions.', services: ['Fever and infections', 'Diabetes management', 'Hypertension care', 'Preventive health checks'] },
  { name: 'ENT', icon: 'ear', shortDescription: 'Ear, nose and throat care for adults and children.', services: ['Hearing tests', 'Sinus treatment', 'Tonsil and adenoid surgery', 'Voice disorders'] },
];

const win = (days, start, end, dur = 30) => days.map((dayOfWeek) => ({ dayOfWeek, startTime: start, endTime: end, slotDurationMinutes: dur }));
const MWF = [1, 3, 5];
const TTS = [2, 4, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

const DOCTORS = [
  { name: 'Dr. Aarav Mehta', dept: 'Cardiology', designation: 'Senior Consultant', specialization: 'Interventional Cardiology', qualifications: ['MBBS', 'MD Medicine', 'DM Cardiology'], experienceYears: 18, gender: 'male', languages: ['English', 'Hindi'], consultationFee: 1200, isFeatured: true, availability: [...win(MWF, '09:00', '13:00'), ...win([2], '16:00', '19:00')] },
  { name: 'Dr. Priya Nair', dept: 'Cardiology', designation: 'Consultant', specialization: 'Preventive Cardiology', qualifications: ['MBBS', 'MD', 'DNB Cardiology'], experienceYears: 11, gender: 'female', languages: ['English', 'Hindi', 'Malayalam'], consultationFee: 900, availability: win(TTS, '10:00', '14:00') },
  { name: 'Dr. Rohan Kapoor', dept: 'Neurology', designation: 'Head of Department', specialization: 'Stroke and Epilepsy', qualifications: ['MBBS', 'MD', 'DM Neurology'], experienceYears: 20, gender: 'male', languages: ['English', 'Hindi', 'Punjabi'], consultationFee: 1400, isFeatured: true, availability: win(WEEKDAYS, '11:00', '15:00', 20) },
  { name: 'Dr. Sneha Iyer', dept: 'Orthopedics', designation: 'Consultant', specialization: 'Joint Replacement', qualifications: ['MBBS', 'MS Orthopedics'], experienceYears: 13, gender: 'female', languages: ['English', 'Hindi', 'Tamil'], consultationFee: 1000, isFeatured: true, availability: [...win(MWF, '10:00', '14:00'), ...win([6], '09:00', '12:00')] },
  { name: 'Dr. Vikram Singh', dept: 'Orthopedics', designation: 'Sports Medicine Specialist', specialization: 'Sports Injuries and Arthroscopy', qualifications: ['MBBS', 'MS Orthopedics', 'Fellowship Sports Medicine'], experienceYears: 9, gender: 'male', languages: ['English', 'Hindi'], consultationFee: 900, availability: win(TTS, '15:00', '19:00') },
  { name: 'Dr. Ananya Rao', dept: 'Pediatrics', designation: 'Senior Consultant', specialization: 'Neonatology', qualifications: ['MBBS', 'MD Pediatrics', 'Fellowship Neonatology'], experienceYears: 15, gender: 'female', languages: ['English', 'Hindi', 'Kannada'], consultationFee: 800, isFeatured: true, availability: win(WEEKDAYS, '09:00', '13:00', 15) },
  { name: 'Dr. Karan Malhotra', dept: 'Pediatrics', designation: 'Consultant', specialization: 'Pediatric Allergy and Asthma', qualifications: ['MBBS', 'DCH', 'MD Pediatrics'], experienceYears: 8, gender: 'male', languages: ['English', 'Hindi'], consultationFee: 700, availability: win(WEEKDAYS, '16:00', '19:00', 15) },
  { name: 'Dr. Meera Deshpande', dept: 'Gynecology & Obstetrics', designation: 'Senior Consultant', specialization: 'High-risk Pregnancy', qualifications: ['MBBS', 'MS Obstetrics & Gynecology'], experienceYears: 17, gender: 'female', languages: ['English', 'Hindi', 'Marathi'], consultationFee: 1100, isFeatured: true, availability: [...win(MWF, '10:00', '14:00'), ...win([4], '16:00', '19:00')] },
  { name: 'Dr. Nisha Bansal', dept: 'Dermatology', designation: 'Consultant', specialization: 'Cosmetic Dermatology', qualifications: ['MBBS', 'MD Dermatology'], experienceYears: 10, gender: 'female', languages: ['English', 'Hindi'], consultationFee: 800, availability: win(TTS, '11:00', '16:00') },
  { name: 'Dr. Sameer Khan', dept: 'General Medicine', designation: 'Consultant Physician', specialization: 'Diabetes and Lifestyle Medicine', qualifications: ['MBBS', 'MD Medicine'], experienceYears: 14, gender: 'male', languages: ['English', 'Hindi', 'Urdu'], consultationFee: 600, availability: win([1, 2, 3, 4, 5, 6], '09:00', '13:00', 15) },
  { name: 'Dr. Lakshmi Reddy', dept: 'General Medicine', designation: 'Consultant Physician', specialization: 'Internal Medicine', qualifications: ['MBBS', 'MD Medicine'], experienceYears: 12, gender: 'female', languages: ['English', 'Hindi', 'Telugu'], consultationFee: 600, availability: win(WEEKDAYS, '14:00', '18:00', 15) },
  { name: 'Dr. Arjun Bhatia', dept: 'ENT', designation: 'Consultant', specialization: 'Sinus and Hearing Disorders', qualifications: ['MBBS', 'MS ENT'], experienceYears: 12, gender: 'male', languages: ['English', 'Hindi'], consultationFee: 800, availability: [...win(MWF, '15:00', '19:00'), ...win([6], '10:00', '13:00')] },
];

const run = async () => {
  await connectDB();

  if (!(await User.findOne({ email: 'admin@hospital.com' }))) {
    await User.create({ name: 'Hospital Admin', email: 'admin@hospital.com', password: 'Admin@12345', role: 'admin' });
    logger.info('Created admin: admin@hospital.com / Admin@12345 (change this password)');
  }

  const deptByName = {};
  for (const [index, data] of DEPARTMENTS.entries()) {
    let dept = await Department.findOne({ name: data.name });
    if (!dept) {
      dept = await Department.create({ ...data, displayOrder: index, description: `${data.shortDescription} Our ${data.name} team works closely with other departments so every patient gets coordinated, evidence-based care.` });
      logger.info(`Created department: ${data.name}`);
    }
    deptByName[data.name] = dept;
  }

  for (const { dept, ...data } of DOCTORS) {
    if (!(await Doctor.findOne({ name: data.name }))) {
      await Doctor.create({ ...data, department: deptByName[dept]._id, bio: `${data.name} is a ${data.designation.toLowerCase()} in ${dept} with ${data.experienceYears} years of experience, specialising in ${data.specialization.toLowerCase()}.` });
      logger.info(`Created doctor: ${data.name}`);
    }
  }

  logger.info('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((e) => {
  logger.error('Seeding failed:', e);
  process.exit(1);
});
