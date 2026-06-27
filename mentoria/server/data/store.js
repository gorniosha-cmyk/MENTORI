// =============================================
//  WriteOff Pro — In-Memory Data Store
// =============================================
const { v4: uuidv4 } = require('uuid');

// ---- Users ----
const users = [
  {
    id: 'u1',
    login: 'staff',
    password: '1234',
    name: 'Смирнов Андрей',
    initials: 'СА',
    role: 'employee',
    store: 'ТЦ «Мегамолл»',
    createdAt: '2025-01-01',
  },
  {
    id: 'u2',
    login: 'manager',
    password: '5678',
    name: 'Новиков Михаил',
    initials: 'НМ',
    role: 'manager',
    createdAt: '2025-01-01',
  },
  {
    id: 'u3',
    login: 'staff2',
    password: '1234',
    name: 'Иванова Мария',
    initials: 'ИМ',
    role: 'employee',
    store: 'ТЦ «Центральный»',
    createdAt: '2025-01-01',
  },
];

// ---- Stores ----
const stores = [
  { id: 's1', name: 'ТЦ «Мегамолл»',     address: 'ул. Ленина, 1' },
  { id: 's2', name: 'ТЦ «Центральный»',   address: 'пр. Мира, 15' },
  { id: 's3', name: 'ТЦ «Северный»',      address: 'ул. Советская, 42' },
  { id: 's4', name: 'ТЦ «Южный»',         address: 'ул. Гагарина, 8' },
  { id: 's5', name: 'ТЦ «Восток»',        address: 'пр. Победы, 3' },
];

// ---- Employees (for deduction) ----
const employees = [
  { id: 'e1', name: 'Иванова Мария Сергеевна',   store: 's1' },
  { id: 'e2', name: 'Петров Алексей Иванович',    store: 's1' },
  { id: 'e3', name: 'Сидорова Елена Петровна',    store: 's2' },
  { id: 'e4', name: 'Козлов Дмитрий Андреевич',   store: 's3' },
  { id: 'e5', name: 'Новикова Ольга Викторовна',  store: 's4' },
  { id: 'e6', name: 'Смирнов Андрей Николаевич',  store: 's5' },
];

// ---- Requests (seeded demo data) ----
const requests = [
  {
    id: uuidv4(),
    authorId: 'u1',
    authorName: 'Смирнов Андрей',
    storeId: 's1',
    storeName: 'ТЦ «Мегамолл»',
    product: 'Торт «Наполеон» 0.5 кг',
    qty: '3 шт',
    deductionType: 'no',
    deductionEmployeeId: null,
    deductionEmployeeName: null,
    comment: 'Истёк срок годности, продукция повреждена при транспортировке',
    photoPath: null,
    status: 'pending',
    rejectReason: null,
    iikoSynced: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reviewedAt: null,
  },
  {
    id: uuidv4(),
    authorId: 'u1',
    authorName: 'Смирнов Андрей',
    storeId: 's2',
    storeName: 'ТЦ «Центральный»',
    product: 'Сок «Добрый» апельсин 1л',
    qty: '12 шт',
    deductionType: 'yes',
    deductionEmployeeId: 'e2',
    deductionEmployeeName: 'Петров Алексей Иванович',
    comment: 'Сотрудник разбил при выкладке на полку, акт составлен',
    photoPath: null,
    status: 'approved',
    rejectReason: null,
    iikoSynced: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    reviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: uuidv4(),
    authorId: 'u3',
    authorName: 'Иванова Мария',
    storeId: 's3',
    storeName: 'ТЦ «Северный»',
    product: 'Молоко «Простоквашино» 2.5% 1л',
    qty: '8 шт',
    deductionType: 'no',
    deductionEmployeeId: null,
    deductionEmployeeName: null,
    comment: 'Продукция не прошла входящий контроль качества по температуре',
    photoPath: null,
    status: 'rejected',
    rejectReason: 'Недостаточно фото-доказательств. Требуется переоформление с фото термометра.',
    iikoSynced: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reviewedAt: new Date(Date.now() - 3600000 * 44).toISOString(),
  },
];

// ---- iiko Config ----
let iikoConfig = {
  connected: false,
  url: '',
  apiKey: '',
};

module.exports = { users, stores, employees, requests, iikoConfig };
