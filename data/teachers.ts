export interface Teacher {
  id: string;
  fullname: string;
  nickname?: string;
  academicTitle?: string;
  position: string; // เช่น 'ประธานหลักสูตร', 'อาจารย์ประจำสาขาวิชา'
  category: string; // เช่น 'Software', 'Data & AI', 'Network & Cloud', 'Database & UX'
  quote?: string;
  about?: string;
  courses?: string[];
  email?: string;
  office?: string;
  image?: string;
  color?: string;
  custom?: boolean;
}

export const teacherCategories = [
  'All',
  'Software',
  'Data & AI',
  'Network & Cloud',
  'Database & UX',
] as const;

export const teacherCategoryLabels: Record<string, string> = {
  All: 'ทั้งหมด',
  Software: 'วิศวกรรมซอฟต์แวร์',
  'Data & AI': 'ข้อมูลและปัญญาประดิษฐ์',
  'Network & Cloud': 'เครือข่ายและคลาวด์',
  'Database & UX': 'ฐานข้อมูลและการออกแบบ',
};

export const defaultTeachers: Teacher[] = [
  {
    id: 'teacher-worachet',
    fullname: 'ผศ.ดร.วรเชษฐ์ สุขเกษม',
    nickname: 'อ.ดร.เชษฐ์',
    position: 'ประธานหลักสูตรวิทยาการคอมพิวเตอร์',
    category: 'Software',
    quote: 'โค้ดที่ดีไม่ใช่แค่รันผ่าน แต่ต้องอ่านง่ายและส่งต่อให้ผู้อื่นพัฒนาต่อได้',
    about: 'ผู้เชี่ยวชาญด้านวิศวกรรมซอฟต์แวร์และสถาปัตยกรรมระบบเว็บ คอยให้คำปรึกษาโครงงานจบและทิศทางการพัฒนาตนเองแก่นักศึกษา CS66 อย่างใกล้ชิด',
    courses: ['Software Engineering', 'Web Development', 'Object-Oriented Programming'],
    email: 'worachet.s@snru.ac.th',
    office: 'อาคาร 10 คณะวิทยาศาสตร์และเทคโนโลยี ห้อง 104',
    color: '#6baaff',
  },
  {
    id: 'teacher-nantiya',
    fullname: 'ผศ.ดร.นันทิยา บุญล้อม',
    nickname: 'อ.นัน',
    position: 'อาจารย์ประจำสาขาวิชา',
    category: 'Data & AI',
    quote: 'ข้อมูลคือหัวใจของการตัดสินใจ จงใช้ปัญญาประดิษฐ์อย่างมีสติและสร้างประโยชน์ต่อสังคม',
    about: 'ผู้เชี่ยวชาญด้าน Machine Learning และ Data Science มุ่งมั่นส่งเสริมให้นักศึกษาสามารถนำโมเดล AI มาประยุกต์แก้ปัญหาจริงในท้องถิ่นและองค์กร',
    courses: ['Artificial Intelligence', 'Data Science', 'Machine Learning Foundations'],
    email: 'nantiya.b@snru.ac.th',
    office: 'อาคาร 10 คณะวิทยาศาสตร์และเทคโนโลยี ห้อง 106',
    color: '#bd9aff',
  },
  {
    id: 'teacher-theerawat',
    fullname: 'อาจารย์ธีรวัฒน์ ชัยชนะ',
    nickname: 'อ.ธี',
    position: 'อาจารย์ประจำสาขาวิชา',
    category: 'Network & Cloud',
    quote: 'ความปลอดภัยของระบบเริ่มต้นที่ความรอบคอบและความเข้าใจในทุกเลเยอร์ของเน็ตเวิร์ก',
    about: 'ผู้เชี่ยวชาญระบบเครือข่าย ความมั่นคงปลอดภัยไซเบอร์ และ Cloud Infrastructure คอยดูแลห้องปฏิบัติการคอมพิวเตอร์และเซิร์ฟเวอร์ของหลักสูตร',
    courses: ['Computer Networks', 'Cybersecurity', 'Cloud Infrastructure & DevOps'],
    email: 'theerawat.c@snru.ac.th',
    office: 'อาคาร 10 ห้องปฏิบัติการระบบเครือข่าย 108',
    color: '#68cfbb',
  },
  {
    id: 'teacher-siriporn',
    fullname: 'อาจารย์ศิริพร พงษ์สถิตย์',
    nickname: 'อ.พร',
    position: 'อาจารย์ประจำสาขาวิชา',
    category: 'Database & UX',
    quote: 'ระบบที่ดีต้องมีรากฐานข้อมูลที่แข็งแรง และมีหน้าบ้านที่ผู้คนใช้งานได้สะดวกใจ',
    about: 'ผู้เชี่ยวชาญการออกแบบฐานข้อมูลเชิงสัมพันธ์และ NoSQL พร้อมทั้งส่งเสริมทักษะ UI/UX Design และการทำ Design System ในผลงานของนักศึกษา',
    courses: ['Database Systems Design', 'Human-Computer Interaction', 'UI/UX Design for Web'],
    email: 'siriporn.p@snru.ac.th',
    office: 'อาคาร 10 คณะวิทยาศาสตร์และเทคโนโลยี ห้อง 105',
    color: '#f6ad55',
  },
];
