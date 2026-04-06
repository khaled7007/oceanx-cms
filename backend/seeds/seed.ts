import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../src/config/database';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  // Admin user
  const password = await bcrypt.hash('Admin@123', 12);
  const userResult = await query(
    `INSERT INTO users (email, password, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ['admin@oceanx.sa', password, 'OceanX Admin', 'admin']
  );
  const adminId = userResult.rows[0].id;
  console.log('✅ Admin user created: admin@oceanx.sa / Admin@123');

  // Reports
  await query(`
    INSERT INTO reports (title_en, title_ar, author, publish_date, tags, status, body_en, created_by)
    VALUES
    ('Annual Ocean Health Report 2024',
     'تقرير صحة المحيط السنوي 2024',
     'Dr. Khalid Al-Rashidi', '2024-01-15',
     ARRAY['ocean','health','annual'],
     'published',
     '<p>This report presents a comprehensive analysis of ocean health metrics collected throughout 2024, highlighting key trends in marine biodiversity, water temperature anomalies, and pollution levels across the Arabian Gulf.</p>',
     $1),
    ('Red Sea Coral Reef Study Q3 2024',
     'دراسة الشعاب المرجانية في البحر الأحمر الربع الثالث 2024',
     'Dr. Fatima Al-Zahrani', '2024-09-01',
     ARRAY['coral','reef','red sea'],
     'published',
     '<p>Quarterly assessment of coral reef bleaching events along the Saudi Red Sea coast, with recommendations for conservation interventions.</p>',
     $1),
    ('Marine Pollution Assessment — Draft',
     'تقييم التلوث البحري - مسودة',
     'Research Team', NULL,
     ARRAY['pollution','assessment'],
     'draft',
     '<p>Ongoing assessment of marine pollution sources and impacts on coastal ecosystems.</p>',
     $1)
  `, [adminId]);
  console.log('✅ Reports seeded');

  // Articles
  await query(`
    INSERT INTO articles (title_en, title_ar, author, category, status, featured, body_en, created_by)
    VALUES
    ('The Future of Sustainable Aquaculture in Saudi Arabia',
     'مستقبل الاستزراع المائي المستدام في المملكة العربية السعودية',
     'Dr. Amal Hassan', 'Research', 'published', true,
     '<p>Saudi Arabia is investing heavily in sustainable aquaculture technologies to reduce dependence on imported seafood while protecting natural marine ecosystems.</p>',
     $1),
    ('Understanding Tidal Patterns in the Arabian Gulf',
     'فهم أنماط المد والجزر في الخليج العربي',
     'Prof. Yusuf Al-Karim', 'Science', 'published', false,
     '<p>A detailed exploration of tidal dynamics unique to the shallow, semi-enclosed basin of the Arabian Gulf.</p>',
     $1),
    ('Climate Change and Rising Sea Temperatures',
     'تغير المناخ وارتفاع درجات حرارة البحر',
     'Dr. Layla Nasser', 'Climate', 'draft', false,
     '<p>Draft article examining the correlation between regional climate change indicators and measured sea surface temperatures.</p>',
     $1)
  `, [adminId]);
  console.log('✅ Articles seeded');

  // Pages
  await query(`
    INSERT INTO pages (slug, title_en, title_ar, meta_title, meta_description, status, sections, created_by)
    VALUES
    ('about', 'About OceanX Insight', 'عن أوشن إكس إنسايت',
     'About Us | OceanX Insight',
     'Learn about OceanX Insight — the leading ocean science and research platform in Saudi Arabia.',
     'published',
     '[{"type":"hero","title_en":"About OceanX Insight","title_ar":"عن أوشن إكس إنسايت","body_en":"We are dedicated to advancing ocean science in the region."},{"type":"text","body_en":"OceanX Insight is a research-driven platform publishing the latest findings in marine science."}]',
     $1),
    ('contact', 'Contact Us', 'اتصل بنا',
     'Contact | OceanX Insight',
     'Get in touch with the OceanX Insight research team.',
     'published',
     '[{"type":"contact_form","email":"info@insight.oceanx.sa","phone":"+966-11-000-0000"}]',
     $1)
  `, [adminId]);
  console.log('✅ Pages seeded');

  // Services
  await query(`
    INSERT INTO services (title_en, title_ar, description_en, description_ar, order_index, active, created_by)
    VALUES
    ('Marine Research', 'البحث البحري',
     'Cutting-edge research on marine ecosystems, biodiversity, and ocean health.',
     'أبحاث متطورة في النظم البيئية البحرية والتنوع البيولوجي وصحة المحيطات.',
     1, true, $1),
    ('Environmental Monitoring', 'رصد البيئة',
     'Continuous monitoring of water quality, temperature, and pollution levels.',
     'رصد مستمر لجودة المياه ودرجة الحرارة ومستويات التلوث.',
     2, true, $1),
    ('Data Analytics', 'تحليل البيانات',
     'Advanced analytics and visualization of oceanographic data.',
     'تحليلات متقدمة وتصور للبيانات الأوقيانوغرافية.',
     3, true, $1),
    ('Conservation Programs', 'برامج الحفظ',
     'Programs dedicated to preserving marine habitats and endangered species.',
     'برامج مخصصة للحفاظ على الموائل البحرية والأنواع المهددة بالانقراض.',
     4, true, $1)
  `, [adminId]);
  console.log('✅ Services seeded');

  // News
  await query(`
    INSERT INTO news (headline_en, headline_ar, source, publish_date, status, body_en, created_by)
    VALUES
    ('OceanX Launches New Research Vessel for Gulf Exploration',
     'أوشن إكس تطلق سفينة أبحاث جديدة لاستكشاف الخليج',
     'OceanX Press', '2024-03-10', 'published',
     '<p>OceanX has unveiled its newest research vessel equipped with advanced sonar and sampling technology for deep-sea exploration in the Arabian Gulf.</p>',
     $1),
    ('Saudi Arabia Expands Marine Protected Areas by 20%',
     'المملكة العربية السعودية توسع المناطق البحرية المحمية بنسبة 20%',
     'Saudi Ministry of Environment', '2024-02-14', 'published',
     '<p>The Saudi government announced the expansion of marine protected areas along its coastlines, covering an additional 12,000 square kilometers.</p>',
     $1),
    ('International Partnership for Red Sea Conservation',
     'شراكة دولية للحفاظ على البحر الأحمر',
     'Reuters', '2024-01-28', 'draft',
     '<p>Pending review — new international partnership agreement between OceanX and leading European research institutions.</p>',
     $1)
  `, [adminId]);
  console.log('✅ News seeded');

  console.log('\n🎉 Database seeding complete!');
  console.log('   Login: admin@oceanx.sa');
  console.log('   Password: Admin@123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
