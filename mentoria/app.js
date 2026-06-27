// ==========================================================================
//  WriteOff Pro — Client Engine & API Integration Console Simulator
// ==========================================================================

// ---- Initial Demo Data Setup ----
const DEFAULT_STORES = {
  's1': 'ТЦ «Мегамолл» — ул. Ленина, 1',
  's2': 'ТЦ «Центральный» — пр. Мира, 15',
  's3': 'ТЦ «Северный» — ул. Советская, 42',
  's4': 'ТЦ «Южный» — ул. Гагарина, 8',
  's5': 'ТЦ «Восток» — пр. Победы, 3'
};

const DEFAULT_EMPLOYEES = {
  'e1': 'Иванова Мария Сергеевна',
  'e2': 'Петров Алексей Иванович',
  'e3': 'Сидорова Елена Петровна',
  'e4': 'Козлов Дмитрий Андреевич',
  'e5': 'Новикова Ольга Викторовна',
  'e6': 'Смирнов Андрей Николаевич'
};

const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    author: 'Смирнов Андрей',
    storeId: 's1',
    storeName: 'ТЦ «Мегамолл»',
    product: 'Пирожное «Эклер» шоколадный',
    qty: '15 шт',
    deductionType: 'no',
    deductionEmployeeId: null,
    deductionEmployeeName: null,
    comment: 'Заветривание крема, потеря товарного вида на витрине.',
    photo: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?q=80&w=300&auto=format&fit=crop',
    photoFilter: 'none',
    status: 'pending',
    rejectReason: null,
    iikoSynced: false,
    iikoActId: null,
    date: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'req-2',
    author: 'Иванова Мария',
    storeId: 's2',
    storeName: 'ТЦ «Центральный»',
    product: 'Кофе зерновой Arabica Premium 1кг',
    qty: '2 упаковки',
    deductionType: 'yes',
    deductionEmployeeId: 'e2',
    deductionEmployeeName: 'Петров Алексей Иванович',
    comment: 'Сотрудник случайно порезал упаковку ножом при распаковке коробки.',
    photo: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=300&auto=format&fit=crop',
    photoFilter: 'contrast',
    status: 'approved',
    rejectReason: null,
    iikoSynced: true,
    iikoActId: 'ACT-98A12B',
    date: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'req-3',
    author: 'Сидорова Елена',
    storeId: 's3',
    storeName: 'ТЦ «Северный»',
    product: 'Молоко пастеризованное 3.2% 1л',
    qty: '10 шт',
    deductionType: 'no',
    deductionEmployeeId: null,
    deductionEmployeeName: null,
    comment: 'Прокисание молока из-за отключения холодильника ночью.',
    photo: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=300&auto=format&fit=crop',
    photoFilter: 'none',
    status: 'rejected',
    rejectReason: 'Отсутствует фото температурного датчика или акта тех. службы о сбое.',
    iikoSynced: false,
    iikoActId: null,
    date: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// ---- State Management ----
let currentUser = null;
let requests = [];
let notifications = [];
let activeFilters = { employee: 'all', manager: 'all' };
let searchQueries = { employee: '', manager: '' };
let currentWizardPhoto = null;
let currentWizardPhotoFilter = 'none';
let currentDetailRequestId = null;
let currentRejectRequestId = null;
let iikoConfig = { connected: false, url: '', apiKey: '' };

// ---- Initializer ----
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('requests')) {
    localStorage.setItem('requests', JSON.stringify(INITIAL_REQUESTS));
  }
  requests = JSON.parse(localStorage.getItem('requests'));

  if (localStorage.getItem('iikoConfig')) {
    iikoConfig = JSON.parse(localStorage.getItem('iikoConfig'));
  }

  notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

  // Check saved session
  const savedUser = sessionStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showUserDashboard();
  }

  // Preloader hide
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('fade-out');
  }, 1000);

  // Setup notification simulation
  setupNotificationSimulator();
  updateLiveFeedText('Мониторинг WriteOff Pro готов. Ожидание заявок...');
});

// ---- Live Feed Logger ----
function updateLiveFeedText(text) {
  const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logStr = `[${time}] ${text}`;
  
  const empFeed = document.getElementById('live-feed-text');
  if (empFeed) empFeed.innerText = logStr;
  
  const mgrFeed = document.getElementById('live-feed-text-mgr');
  if (mgrFeed) mgrFeed.innerText = logStr;
}

// ---- Auth Logic ----
function handleLogin(event) {
  event.preventDefault();
  const loginInput = document.getElementById('auth-login').value.trim();
  const passwordInput = document.getElementById('auth-password').value;
  const errorDiv = document.getElementById('auth-error');
  const spinner = document.getElementById('auth-spinner');
  const btnText = document.querySelector('#auth-btn .btn-text');

  errorDiv.classList.add('hidden');

  if (!loginInput || !passwordInput) {
    showToast('Ошибка входа', 'Заполните логин и пароль', 'error');
    return;
  }

  spinner.classList.remove('hidden');
  btnText.style.opacity = '0.5';

  setTimeout(() => {
    spinner.classList.add('hidden');
    btnText.style.opacity = '1';

    if (loginInput === 'staff' && passwordInput === '1234') {
      currentUser = {
        login: 'staff',
        name: 'Смирнов Андрей',
        initials: 'СА',
        role: 'employee',
        storeName: 'ТЦ «Мегамолл»'
      };
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      showUserDashboard();
      showToast('Успешный вход', 'Вы вошли как Смирнов Андрей', 'success');
      updateLiveFeedText('Сотрудник Смирнов Андрей авторизован в системе.');
    } else if (loginInput === 'manager' && passwordInput === '5678') {
      currentUser = {
        login: 'manager',
        name: 'Новиков Михаил',
        initials: 'НМ',
        role: 'manager'
      };
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      showUserDashboard();
      showToast('Успешный вход', 'Вы вошли как контролирующий', 'success');
      updateLiveFeedText('Менеджер Новиков Михаил авторизован в системе контроля.');
    } else {
      errorDiv.classList.remove('hidden');
      showToast('Вход не удался', 'Неверный пароль или логин', 'error');
    }
  }, 900);
}

function fillDemo(role) {
  const loginInput = document.getElementById('auth-login');
  const passwordInput = document.getElementById('auth-password');
  if (role === 'employee') {
    loginInput.value = 'staff';
    passwordInput.value = '1234';
  } else {
    loginInput.value = 'manager';
    passwordInput.value = '5678';
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('auth-password');
  const toggleBtn = document.getElementById('toggle-password');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    passwordInput.type = 'password';
    toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

function logout() {
  updateLiveFeedText(`Пользователь ${currentUser.name} вышел из системы.`);
  currentUser = null;
  sessionStorage.removeItem('currentUser');

  document.getElementById('page-employee').classList.remove('active');
  document.getElementById('page-manager').classList.remove('active');
  document.getElementById('page-auth').classList.add('active');

  document.getElementById('auth-form').reset();
  showToast('Выход', 'Сессия завершена', 'info');
}

// ---- Direct Role Switcher (Hackathon Presentation Helper) ----
function switchRoleDirect(role) {
  if (role === 'employee') {
    currentUser = {
      login: 'staff',
      name: 'Смирнов Андрей',
      initials: 'СА',
      role: 'employee',
      storeName: 'ТЦ «Мегамолл»'
    };
  } else {
    currentUser = {
      login: 'manager',
      name: 'Новиков Михаил',
      initials: 'НМ',
      role: 'manager'
    };
  }
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  closeDrawer();
  
  document.getElementById('page-employee').classList.remove('active');
  document.getElementById('page-manager').classList.remove('active');
  
  showUserDashboard();
  showToast('Переключение роли', `Вы переключились на роль: ${role === 'employee' ? 'Сотрудник' : 'Проверяющий'}`, 'info');
}

// ---- Dashboards Navigation ----
function showUserDashboard() {
  document.getElementById('page-auth').classList.remove('active');

  if (currentUser.role === 'employee') {
    document.getElementById('page-employee').classList.add('active');
    navigateEmpPage('dashboard');
    updateEmployeeStats();
  } else {
    document.getElementById('page-manager').classList.add('active');
    navigateMgrPage('dashboard');
    updateManagerStats();
    drawActivityChart();
  }
}

function navigateEmpPage(target) {
  const sections = document.querySelectorAll('#page-employee .subpage');
  sections.forEach(s => s.classList.remove('active'));

  const activeSection = document.getElementById(`emp-page-${target}`);
  if (activeSection) activeSection.classList.add('active');

  const links = document.querySelectorAll('#page-employee .sidebar-link');
  links.forEach(l => {
    if (l.getAttribute('data-emp-page') === target) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  const titles = {
    'dashboard': 'Сводка списаний',
    'new-request': 'Новое списание',
    'my-requests': 'Мои заявки',
    'profile': 'Кабинет сотрудника'
  };
  document.getElementById('emp-page-title').innerText = titles[target] || 'Панель';

  if (target === 'dashboard') {
    renderEmployeeRecentRequests();
    updateEmployeeStats();
  } else if (target === 'my-requests') {
    renderEmployeeAllRequests();
  } else if (target === 'profile') {
    renderEmployeeProfile();
  } else if (target === 'new-request') {
    resetWizard();
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) {
    toggleSidebar('employee');
  }
}

function navigateMgrPage(target) {
  const sections = document.querySelectorAll('#page-manager .subpage');
  sections.forEach(s => s.classList.remove('active'));

  const activeSection = document.getElementById(`mgr-page-${target}`);
  if (activeSection) activeSection.classList.add('active');

  const links = document.querySelectorAll('#page-manager .sidebar-link');
  links.forEach(l => {
    if (l.getAttribute('data-mgr-page') === target) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  const titles = {
    'dashboard': 'Дашборд верификации',
    'pending': 'На проверке',
    'history': 'История верификаций',
    'profile': 'iiko Cloud API'
  };
  document.getElementById('mgr-page-title').innerText = titles[target] || 'Панель';

  if (target === 'dashboard') {
    renderManagerRecentRequests();
    updateManagerStats();
    drawActivityChart();
  } else if (target === 'pending') {
    renderManagerPendingRequests();
  } else if (target === 'history') {
    renderManagerHistoryRequests();
  } else if (target === 'profile') {
    renderManagerProfile();
  }

  const sidebar = document.getElementById('mgr-sidebar');
  if (sidebar.classList.contains('open')) {
    toggleSidebar('manager');
  }
}

function toggleSidebar(role) {
  if (role === 'employee') {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('emp-sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  } else {
    const sidebar = document.getElementById('mgr-sidebar');
    const overlay = document.getElementById('mgr-sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  }
}

// ---- Employee Logic Implementation ----
function updateEmployeeStats() {
  const ownRequests = requests.filter(r => r.author === currentUser.name);

  const pending = ownRequests.filter(r => r.status === 'pending').length;
  const approved = ownRequests.filter(r => r.status === 'approved').length;
  const rejected = ownRequests.filter(r => r.status === 'rejected').length;

  document.getElementById('emp-stat-total').innerText = ownRequests.length;
  document.getElementById('emp-stat-pending').innerText = pending;
  document.getElementById('emp-stat-approved').innerText = approved;
  document.getElementById('emp-stat-rejected').innerText = rejected;

  document.getElementById('emp-badge').innerText = ownRequests.length;
  document.getElementById('emp-greeting-name').innerText = currentUser.name.split(' ')[0];
  document.getElementById('emp-name').innerText = currentUser.name;
  document.getElementById('emp-avatar').innerText = currentUser.initials;
  document.getElementById('topbar-emp-avatar').innerText = currentUser.initials;
}

function renderEmployeeRecentRequests() {
  const listContainer = document.getElementById('emp-recent-list');
  const ownRequests = requests.filter(r => r.author === currentUser.name);

  if (ownRequests.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
        <p>Заявки еще не создавались</p>
      </div>`;
    return;
  }

  const sorted = [...ownRequests].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  listContainer.innerHTML = sorted.map(r => generateRequestCardHTML(r)).join('');
}

function renderEmployeeAllRequests() {
  const listContainer = document.getElementById('emp-all-requests-list');
  const ownRequests = requests.filter(r => r.author === currentUser.name);

  let filtered = ownRequests.filter(r => {
    if (activeFilters.employee !== 'all' && r.status !== activeFilters.employee) return false;
    if (searchQueries.employee) {
      const q = searchQueries.employee.toLowerCase();
      return r.product.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <p>Заявки не найдены</p>
      </div>`;
    return;
  }

  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
  listContainer.innerHTML = sorted.map(r => generateRequestCardHTML(r)).join('');
}

function setEmpFilter(btn, filterValue) {
  const chips = btn.parentNode.querySelectorAll('.chip');
  chips.forEach(c => c.classList.remove('active'));
  btn.classList.add('active');

  activeFilters.employee = filterValue;
  renderEmployeeAllRequests();
}

function filterEmpRequests() {
  searchQueries.employee = document.getElementById('emp-search').value.trim();
  renderEmployeeAllRequests();
}

function renderEmployeeProfile() {
  const ownRequests = requests.filter(r => r.author === currentUser.name);
  const approved = ownRequests.filter(r => r.status === 'approved').length;
  const rate = ownRequests.length > 0 ? Math.round((approved / ownRequests.length) * 100) : 0;

  document.getElementById('emp-profile-name').innerText = currentUser.name;
  document.getElementById('emp-profile-avatar').innerText = currentUser.initials;
  document.getElementById('emp-profile-total').innerText = ownRequests.length;
  document.getElementById('emp-profile-approved').innerText = approved;
  document.getElementById('emp-profile-rate').innerText = `${rate}%`;

  document.getElementById('emp-profile-info-name').innerText = currentUser.name;
  document.getElementById('emp-profile-info-store').innerText = currentUser.storeName;
}

// ---- Employee Creation Wizard Implementation ----
function triggerPhotoInput() {
  document.getElementById('photo-input').click();
}

function handlePhotoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast('Ошибка размера', 'Фотография не должна превышать 10 МБ', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentWizardPhoto = e.target.result;
    document.getElementById('photo-placeholder').classList.add('hidden');
    const preview = document.getElementById('photo-preview');
    const previewImg = document.getElementById('photo-preview-img');
    preview.classList.remove('hidden');
    previewImg.src = currentWizardPhoto;

    // Show adjustment filters panel
    document.getElementById('photo-filters-panel').classList.remove('hidden');
    showToast('Фото загружено', 'Примените фильтры при необходимости', 'success');
  };
  reader.readAsDataURL(file);
}

function removePhoto(event) {
  event.stopPropagation();
  currentWizardPhoto = null;
  currentWizardPhotoFilter = 'none';
  document.getElementById('photo-input').value = '';
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-placeholder').classList.remove('hidden');
  document.getElementById('photo-filters-panel').classList.add('hidden');
  
  const previewImg = document.getElementById('photo-preview-img');
  previewImg.className = '';
}

function applyPhotoFilter(filterType, btnElement) {
  currentWizardPhotoFilter = filterType;
  const buttons = btnElement.parentNode.querySelectorAll('.btn');
  buttons.forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');

  const previewImg = document.getElementById('photo-preview-img');
  previewImg.className = '';
  if (filterType !== 'none') {
    previewImg.classList.add(`filter-${filterType}`);
  }
}

function toggleDeductionEmployee(show) {
  const group = document.getElementById('employee-select-group');
  if (show) {
    group.style.display = 'block';
  } else {
    group.style.display = 'none';
    document.getElementById('req-employee').value = '';
  }
}

function updateCommentCount() {
  const val = document.getElementById('req-comment').value;
  document.getElementById('comment-count').innerText = val.length;
}

function goToStep(stepNum) {
  // Photo is optional — no hard block on step 2

  if (stepNum === 3) {
    const store = document.getElementById('req-store').value;
    const product = document.getElementById('req-product').value.trim();
    const qty = document.getElementById('req-qty').value.trim();
    const isDeduction = document.querySelector('input[name="deduction-type"]:checked').value === 'yes';
    const employee = document.getElementById('req-employee').value;
    const comment = document.getElementById('req-comment').value.trim();

    if (!store || !product || !qty || !comment) {
      showToast('Заполните поля', 'Пожалуйста, заполните обязательные параметры (*)', 'error');
      return;
    }

    if (isDeduction && !employee) {
      showToast('Укажите сотрудника', 'Выберите ответственного сотрудника для удержания', 'error');
      return;
    }

    if (comment.length < 10) {
      showToast('Мало текста', 'Комментарий должен содержать не менее 10 символов', 'warning');
      return;
    }

    // Build Step 3 Review UI
    const storeName = DEFAULT_STORES[store] || store;
    const employeeName = isDeduction ? (DEFAULT_EMPLOYEES[employee] || employee) : null;
    
    // Apply appropriate class filter for visual representation
    const filterClass = currentWizardPhotoFilter !== 'none' ? `filter-${currentWizardPhotoFilter}` : '';

    const reviewContent = document.getElementById('review-content');
    reviewContent.innerHTML = `
      <div class="review-item">
        <div class="review-label">Торговая точка</div>
        <div class="review-value">${storeName}</div>
      </div>
      <div class="review-item">
        <div class="review-label">Товар</div>
        <div class="review-value">${product}</div>
      </div>
      <div class="review-item">
        <div class="review-label">Объем / Количество</div>
        <div class="review-value">${qty}</div>
      </div>
      <div class="review-item">
        <div class="review-label">Тип списания</div>
        <div class="review-value">${isDeduction ? `С удержанием (${employeeName})` : 'Без удержания'}</div>
      </div>
      <div class="review-item" style="grid-column: 1/-1;">
        <div class="review-label">Обоснование</div>
        <div class="review-value">${comment}</div>
      </div>
      <div class="review-photo">
        <div class="review-label">Фотоматериал (Фильтр: ${currentWizardPhotoFilter})</div>
        <div class="photo-preview ${filterClass}" style="position:relative; height:150px; border-radius:10px; overflow:hidden; border:1px solid var(--border); margin-top:5px;">
          <img src="${currentWizardPhoto}" alt="Фото списания" style="width:100%; height:100%; object-fit:cover;"/>
        </div>
      </div>
    `;
  }

  // Toggle step visual states
  document.querySelectorAll('#page-employee .form-step').forEach(step => step.classList.remove('active'));
  document.getElementById(`form-step-${stepNum}`).classList.add('active');

  // Indicators update
  document.getElementById('step-1-ind').className = stepNum >= 1 ? (stepNum > 1 ? 'step done' : 'step active') : 'step';
  document.getElementById('step-2-ind').className = stepNum >= 2 ? (stepNum > 2 ? 'step done' : 'step active') : 'step';
  document.getElementById('step-3-ind').className = stepNum >= 3 ? 'step active' : 'step';

  document.getElementById('step-line-1').className = stepNum >= 2 ? 'step-line active' : 'step-line';
  document.getElementById('step-line-2').className = stepNum >= 3 ? 'step-line active' : 'step-line';
}

function handleRequestSubmit(event) {
  event.preventDefault();

  const storeId = document.getElementById('req-store').value;
  const storeText = DEFAULT_STORES[storeId].split(' — ')[0];
  const product = document.getElementById('req-product').value.trim();
  const qty = document.getElementById('req-qty').value.trim();
  const deductionType = document.querySelector('input[name="deduction-type"]:checked').value;
  const employeeId = document.getElementById('req-employee').value;
  const comment = document.getElementById('req-comment').value.trim();

  const spinner = document.getElementById('submit-spinner');
  spinner.classList.remove('hidden');

  setTimeout(() => {
    const newReq = {
      id: `req-${Date.now()}`,
      author: currentUser.name,
      storeId,
      storeName: storeText,
      product,
      qty,
      deductionType,
      deductionEmployeeId: deductionType === 'yes' ? employeeId : null,
      deductionEmployeeName: deductionType === 'yes' ? DEFAULT_EMPLOYEES[employeeId] : null,
      comment,
      photo: currentWizardPhoto,
      photoFilter: currentWizardPhotoFilter,
      status: 'pending',
      rejectReason: null,
      iikoSynced: false,
      iikoActId: null,
      date: new Date().toISOString()
    };

    requests.unshift(newReq);
    localStorage.setItem('requests', JSON.stringify(requests));

    spinner.classList.add('hidden');

    // Display overlay
    const overlay = document.getElementById('success-overlay');
    document.getElementById('success-title').innerText = 'Заявка зарегистрирована';
    document.getElementById('success-subtitle').innerText = 'Заявка отправлена менеджеру на рассмотрение';
    overlay.classList.remove('hidden');

    // Notify simulator
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Создано списание',
      message: `${currentUser.name} списал "${product}" в объеме ${qty} (${storeText})`,
      date: new Date().toISOString(),
      read: false
    };
    notifications.unshift(newNotif);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    updateLiveFeedText(`Сотрудник ${currentUser.name} создал заявку на списание ${product} (${qty}).`);

    setTimeout(() => {
      overlay.classList.add('hidden');
      resetWizard();
      navigateEmpPage('dashboard');
    }, 1800);

  }, 1000);
}

function resetWizard() {
  document.getElementById('request-form').reset();
  currentWizardPhoto = null;
  currentWizardPhotoFilter = 'none';
  document.getElementById('photo-input').value = '';
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-placeholder').classList.remove('hidden');
  document.getElementById('photo-filters-panel').classList.add('hidden');
  toggleDeductionEmployee(false);
  document.getElementById('comment-count').innerText = 0;
  
  const previewImg = document.getElementById('photo-preview-img');
  previewImg.className = '';

  goToStep(1);
}

// ---- Manager Logic Implementation ----
function updateManagerStats() {
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  document.getElementById('mgr-stat-total').innerText = requests.length;
  document.getElementById('mgr-stat-pending').innerText = pending;
  document.getElementById('mgr-stat-approved').innerText = approved;
  document.getElementById('mgr-stat-rejected').innerText = rejected;

  // Badge updates
  const pendingBadge = document.getElementById('mgr-pending-badge');
  pendingBadge.innerText = pending;
  pendingBadge.style.display = pending > 0 ? 'flex' : 'none';

  const unreadCount = notifications.filter(n => !n.read).length;
  const notifDot = document.getElementById('mgr-notif-dot');
  if (unreadCount > 0) {
    notifDot.classList.add('visible');
  } else {
    notifDot.classList.remove('visible');
  }

  document.getElementById('mgr-name').innerText = currentUser.name;
  document.getElementById('mgr-avatar').innerText = currentUser.initials;
  document.getElementById('topbar-mgr-avatar').innerText = currentUser.initials;
}

function renderManagerRecentRequests() {
  const listContainer = document.getElementById('mgr-recent-list');
  const pending = requests.filter(r => r.status === 'pending');

  if (pending.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
        <p>Все заявки проверены</p>
      </div>`;
    return;
  }

  const sorted = [...pending].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  listContainer.innerHTML = sorted.map(r => generateRequestCardHTML(r)).join('');
}

function renderManagerPendingRequests() {
  const listContainer = document.getElementById('mgr-pending-list');
  const pending = requests.filter(r => r.status === 'pending');

  if (pending.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
        <p>Список заявок на модерации пуст</p>
      </div>`;
    return;
  }

  const sorted = [...pending].sort((a,b) => new Date(b.date) - new Date(a.date));
  listContainer.innerHTML = sorted.map(r => generateRequestCardHTML(r)).join('');
}

function renderManagerHistoryRequests() {
  const listContainer = document.getElementById('mgr-history-list');

  let filtered = requests.filter(r => {
    if (r.status === 'pending') return false;

    // Filters
    if (activeFilters.manager === 'approved' && r.status !== 'approved') return false;
    if (activeFilters.manager === 'rejected' && r.status !== 'rejected') return false;
    if (activeFilters.manager === 'no-deduction' && r.deductionType !== 'no') return false;
    if (activeFilters.manager === 'with-deduction' && r.deductionType !== 'yes') return false;

    // Search query
    if (searchQueries.manager) {
      const q = searchQueries.manager.toLowerCase();
      return r.product.toLowerCase().includes(q) ||
             r.author.toLowerCase().includes(q) ||
             r.storeName.toLowerCase().includes(q) ||
             r.comment.toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <p>Совпадений в архиве не найдено</p>
      </div>`;
    return;
  }

  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
  listContainer.innerHTML = sorted.map(r => generateRequestCardHTML(r)).join('');
}

function setMgrFilter(btn, filterValue) {
  const chips = btn.parentNode.querySelectorAll('.chip');
  chips.forEach(c => c.classList.remove('active'));
  btn.classList.add('active');

  activeFilters.manager = filterValue;
  renderManagerHistoryRequests();
}

function filterMgrHistory() {
  searchQueries.manager = document.getElementById('mgr-search').value.trim();
  renderManagerHistoryRequests();
}

function renderManagerProfile() {
  const reviewed = requests.filter(r => r.status !== 'pending');
  const approved = reviewed.filter(r => r.status === 'approved').length;
  const rate = reviewed.length > 0 ? Math.round((approved / reviewed.length) * 100) : 0;

  document.getElementById('mgr-profile-reviewed').innerText = reviewed.length;
  document.getElementById('mgr-profile-approved-count').innerText = approved;
  document.getElementById('mgr-profile-rate').innerText = `${rate}%`;

  document.getElementById('mgr-profile-name').innerText = currentUser.name;
  document.getElementById('mgr-profile-avatar').innerText = currentUser.initials;

  document.getElementById('iiko-url').value = iikoConfig.url || '';
  document.getElementById('iiko-key').value = iikoConfig.apiKey || '';
  updateIikoUIState();
}

// ---- iiko Integration Engine Implementation ----
function testIikoConnection() {
  const url = document.getElementById('iiko-url').value.trim();
  const apiKey = document.getElementById('iiko-key').value.trim();

  if (!url || !apiKey) {
    showToast('Ошибка конфигурации', 'Введите URL и API ключ списания iiko', 'error');
    return;
  }

  const btn = document.getElementById('iiko-test-btn');
  const spinner = document.getElementById('iiko-spinner');
  const btnText = btn.querySelector('.btn-text');

  spinner.classList.remove('hidden');
  btnText.style.opacity = '0.5';

  setTimeout(() => {
    spinner.classList.add('hidden');
    btnText.style.opacity = '1';

    if (url.startsWith('http')) {
      iikoConfig.connected = true;
      iikoConfig.url = url;
      iikoConfig.apiKey = apiKey;
      localStorage.setItem('iikoConfig', JSON.stringify(iikoConfig));
      updateIikoUIState();
      showToast('iiko API подключено', 'Соединение успешно установлено. Обновление остатков доступно.', 'success');
      updateLiveFeedText('Канал связи с API iiko Cloud успешно верифицирован.');
    } else {
      iikoConfig.connected = false;
      localStorage.setItem('iikoConfig', JSON.stringify(iikoConfig));
      updateIikoUIState();
      showToast('Ошибка соединения', 'Неверный адрес. Должен начинаться с http:// или https://', 'error');
    }
  }, 1400);
}

function updateIikoUIState() {
  const dot = document.getElementById('iiko-status-dot');
  const text = document.getElementById('iiko-status-text');
  if (!dot || !text) return;

  if (iikoConfig.connected) {
    dot.className = 'status-dot connected';
    text.innerText = 'Подключено к iiko Cloud API';
  } else {
    dot.className = 'status-dot disconnected';
    text.innerText = 'Не подключено к iiko API';
  }
}

// ---- API Console Log Sync Animation ----
function syncRequestToIiko(requestId, btnElement) {
  const reqObj = requests.find(r => r.id === requestId);
  if (!reqObj) return;

  btnElement.classList.add('hidden');

  // Insert console element inside the drawer
  const contentArea = document.getElementById('drawer-content');
  const consoleDiv = document.createElement('div');
  consoleDiv.className = 'api-console-box';
  consoleDiv.innerHTML = `
    <div class="console-title">
      <div class="console-spinner"></div>
      <span>iiko API Console Session</span>
    </div>
    <div class="console-log-area" id="console-log-area">
      <!-- Lines added sequentially -->
    </div>
  `;
  contentArea.appendChild(consoleDiv);

  const logArea = document.getElementById('console-log-area');
  const logLines = [
    { text: `[INIT] Establishing iiko Cloud API session...`, type: 'info', delay: 400 },
    { text: `[POST] /api/v1/auth/access_token verifying credentials...`, type: 'info', delay: 600 },
    { text: `[AUTH] Session key retrieved: ${Math.random().toString(36).substr(2, 16).toUpperCase()}`, type: 'success', delay: 400 },
    { text: `[GET] /api/v1/stores/details checking store status...`, type: 'info', delay: 500 },
    { text: `[POST] /api/v1/writeoff/documents compiling write-off act...`, type: 'info', delay: 800 },
    { text: `[POST] Creating document iiko ID: 77a0-df12-ff93-b1c8...`, type: 'info', delay: 700 },
    { text: `[IIKO] Act registered successfully. Balance decremented.`, type: 'success', delay: 600 },
    { text: `[SYNC] Process finished with status code 200 OK.`, type: 'success', delay: 300 }
  ];

  let currentLineIndex = 0;

  function appendNextLine() {
    if (currentLineIndex < logLines.length) {
      const log = logLines[currentLineIndex];
      const p = document.createElement('div');
      p.className = `log-line ${log.type}`;
      p.innerText = log.text;
      logArea.appendChild(p);
      logArea.scrollTop = logArea.scrollHeight;

      currentLineIndex++;
      setTimeout(appendNextLine, log.delay);
    } else {
      // Completed, set actual iiko synced fields
      const mockAct = `ACT-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`;
      reqObj.iikoSynced = true;
      reqObj.iikoActId = mockAct;

      localStorage.setItem('requests', JSON.stringify(requests));

      // Update drawer footer to show success synced state
      const drawerFooter = document.getElementById('drawer-footer');
      drawerFooter.innerHTML = `
        <div class="iiko-sync-alert" style="width:100%">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Синхронизировано iiko Cloud. Акт: <strong>${mockAct}</strong>
        </div>
      `;

      // Update background dashboards
      if (currentUser.role === 'manager') {
        renderManagerHistoryRequests();
        renderManagerRecentRequests();
        updateManagerStats();
      }

      showToast('iiko Синхронизация', `Создан акт списания: ${mockAct}`, 'success');
      updateLiveFeedText(`Списание ${reqObj.product} синхронизировано с iiko (Акт: ${mockAct}).`);
    }
  }

  // Start sequence
  appendNextLine();
}

// ---- Premium Drawer Implementation ----
function openDrawer(requestId) {
  const reqObj = requests.find(r => r.id === requestId);
  if (!reqObj) return;

  currentDetailRequestId = requestId;

  const overlay = document.getElementById('drawer-overlay');
  const drawer = document.getElementById('request-drawer');
  const drawerContent = document.getElementById('drawer-content');
  const drawerFooter = document.getElementById('drawer-footer');
  const subtitleId = document.getElementById('drawer-subtitle-id');

  subtitleId.innerText = `ID: ${reqObj.id}`;

  const filterClass = (reqObj.photoFilter && reqObj.photoFilter !== 'none') ? `filter-${reqObj.photoFilter}` : '';

  const photoHTML = reqObj.photo
    ? `<div class="${filterClass}" style="border-radius:10px; overflow:hidden; border:1px solid var(--border);"><img class="drawer-photo" src="${reqObj.photo}" alt="Фото списания" /></div>`
    : `<div class="drawer-photo" style="display:flex; align-items:center; justify-content:center; background:var(--border); height:150px; color:var(--text-muted); border-radius:10px;">Снимок отсутствует</div>`;

  const formattedDate = new Date(reqObj.date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const statusMap = {
    'pending': 'На проверке',
    'approved': 'Одобрено',
    'rejected': 'Отклонено'
  };

  drawerContent.innerHTML = `
    ${photoHTML}
    <div class="drawer-detail-grid">
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Наименование товара</div>
        <div class="drawer-detail-value">${reqObj.product}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Объем / Количество</div>
        <div class="drawer-detail-value">${reqObj.qty}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Торговая точка</div>
        <div class="drawer-detail-value">${reqObj.storeName}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Инициатор</div>
        <div class="drawer-detail-value">${reqObj.author}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Дата отправки</div>
        <div class="drawer-detail-value">${formattedDate}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Характер списания</div>
        <div class="drawer-detail-value">${reqObj.deductionType === 'yes' ? `С удержанием (${reqObj.deductionEmployeeName})` : 'Без удержания'}</div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Статус модерации</div>
        <div class="drawer-detail-value">
          <span class="status-badge status-${reqObj.status}">
            ${statusMap[reqObj.status]}
          </span>
        </div>
      </div>
      <div class="drawer-detail-item">
        <div class="drawer-detail-label">Связь с iiko</div>
        <div class="drawer-detail-value">
          ${reqObj.iikoSynced ? `<span style="color:var(--green)">Экспортировано</span>` : `<span style="color:var(--text-muted)">В очереди</span>`}
        </div>
      </div>
    </div>
    <div>
      <div class="drawer-comment-label">Детализированное обоснование</div>
      <div class="drawer-comment-box">${reqObj.comment}</div>
    </div>
    ${reqObj.rejectReason ? `
      <div class="reject-reason-display">
        <strong>Комментарий проверяющего:</strong><br/>
        ${reqObj.rejectReason}
      </div>
    ` : ''}
  `;

  // Draw Footer buttons
  if (currentUser.role === 'manager' && reqObj.status === 'pending') {
    drawerFooter.innerHTML = `
      <button class="btn btn-ghost" onclick="openRejectModal('${reqObj.id}')">Отклонить</button>
      <button class="btn btn-primary" onclick="approveRequest('${reqObj.id}')">Одобрить</button>
    `;
  } else if (currentUser.role === 'manager' && reqObj.status === 'approved') {
    if (reqObj.iikoSynced) {
      drawerFooter.innerHTML = `
        <div class="iiko-sync-alert" style="width:100%">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Синхронизировано iiko Cloud. Акт: <strong>${reqObj.iikoActId}</strong>
        </div>
      `;
    } else {
      drawerFooter.innerHTML = `
        <button class="btn btn-success btn-full" onclick="syncRequestToIiko('${reqObj.id}', this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h6v8h-6z"/><path d="M12 12h2"/></svg>
          Синхронизировать с iiko Cloud
        </button>
      `;
    }
  } else {
    drawerFooter.innerHTML = `<button class="btn btn-ghost" onclick="closeDrawer()">Закрыть</button>`;
  }

  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
}

function closeDrawer() {
  const overlay = document.getElementById('drawer-overlay');
  const drawer = document.getElementById('request-drawer');
  if (overlay) overlay.classList.add('hidden');
  if (drawer) drawer.classList.add('hidden');
  currentDetailRequestId = null;
}

// ---- Manager Moderation Actions ----
function approveRequest(requestId) {
  const reqObj = requests.find(r => r.id === requestId);
  if (!reqObj) return;

  reqObj.status = 'approved';
  localStorage.setItem('requests', JSON.stringify(requests));

  showToast('Заявка одобрена', `Товар "${reqObj.product}" подтвержден.`, 'success');
  updateLiveFeedText(`Менеджер одобрил заявку на списание ${reqObj.product}.`);

  updateManagerStats();
  renderManagerRecentRequests();
  renderManagerPendingRequests();

  const overlay = document.getElementById('success-overlay');
  document.getElementById('success-title').innerText = 'Заявка одобрена';
  document.getElementById('success-subtitle').innerText = 'Акт готов к синхронизации с iiko Cloud API';
  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
    closeDrawer();
    openDrawer(requestId); // Re-open to let them sync to iiko
  }, 1000);
}

function openRejectModal(requestId) {
  currentRejectRequestId = requestId;
  document.getElementById('reject-reason').value = '';
  document.getElementById('reject-modal').classList.remove('hidden');
}

function closeRejectModal() {
  document.getElementById('reject-modal').classList.add('hidden');
  currentRejectRequestId = null;
}

function confirmRejectSubmit() {
  const reason = document.getElementById('reject-reason').value.trim();
  if (!reason) {
    showToast('Ошибка', 'Введите обоснование отклонения заявки', 'error');
    return;
  }

  const reqObj = requests.find(r => r.id === currentRejectRequestId);
  if (!reqObj) return;

  reqObj.status = 'rejected';
  reqObj.rejectReason = reason;

  localStorage.setItem('requests', JSON.stringify(requests));

  showToast('Заявка отклонена', `Списание товара "${reqObj.product}" аннулировано.`, 'warning');
  updateLiveFeedText(`Менеджер отклонил заявку на списание ${reqObj.product}. Причина: ${reason}`);

  updateManagerStats();
  renderManagerRecentRequests();
  renderManagerPendingRequests();

  closeRejectModal();
  closeDrawer();
}

// ---- Notifications Panel Implementation ----
function toggleNotificationsPanel(event) {
  event.stopPropagation();
  const panel = document.getElementById('notifications-panel');
  panel.classList.toggle('hidden');

  if (!panel.classList.contains('hidden')) {
    notifications.forEach(n => n.read = true);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateManagerStats();
    renderNotificationsList();
  }
}

document.body.addEventListener('click', () => {
  const panel = document.getElementById('notifications-panel');
  if (panel) panel.classList.add('hidden');
});

function renderNotificationsList() {
  const list = document.getElementById('notif-list');
  if (notifications.length === 0) {
    list.innerHTML = `<div class="notif-empty">Уведомлений нет</div>`;
    return;
  }

  list.innerHTML = notifications.map(n => {
    const timeStr = new Date(n.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="notif-item">
        <div style="font-weight:600; color:var(--text-primary);">${n.title}</div>
        <div style="margin-top:2px; color:var(--text-secondary); line-height:1.3">${n.message}</div>
        <div class="notif-time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

function clearNotifications() {
  notifications = [];
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateManagerStats();
  renderNotificationsList();
  showToast('Очищено', 'Все уведомления стерты', 'info');
}

// ---- Custom SVG Chart Renderer ----
function drawActivityChart() {
  const container = document.getElementById('mgr-chart-container');
  if (!container) return;

  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - 3600000 * 24 * i);
    const dayName = daysOfWeek[d.getDay()];

    const approvedCount = requests.filter(r => {
      if (r.status !== 'approved') return false;
      return new Date(r.date).toDateString() === d.toDateString();
    }).length;

    const rejectedCount = requests.filter(r => {
      if (r.status !== 'rejected') return false;
      return new Date(r.date).toDateString() === d.toDateString();
    }).length;

    data.push({ day: dayName, approved: approvedCount, rejected: rejectedCount });
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.approved, d.rejected)), 1);

  container.innerHTML = data.map(d => {
    const approvedHeight = (d.approved / maxVal) * 100;
    const rejectedHeight = (d.rejected / maxVal) * 100;

    return `
      <div class="chart-column">
        <div class="chart-bars">
          <div class="chart-bar approved" style="height:${approvedHeight || 4}%" data-val="${d.approved} одобр."></div>
          <div class="chart-bar rejected" style="height:${rejectedHeight || 4}%" data-val="${d.rejected} отклон."></div>
        </div>
        <div class="chart-label">${d.day}</div>
      </div>
    `;
  }).join('');
}

// ---- Generate Card HTML Helper ----
function generateRequestCardHTML(req) {
  const formattedDate = new Date(req.date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const filterClass = (req.photoFilter && req.photoFilter !== 'none') ? `filter-${req.photoFilter}` : '';

  const photoThumb = req.photo
    ? `<div class="${filterClass}" style="width:38px; height:38px; border-radius:5px; overflow:hidden; flex-shrink:0;"><img src="${req.photo}" alt="Миниатюра" style="width:100%; height:100%; object-fit:cover;" /></div>`
    : `<div class="request-thumb no-photo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5-2 4-2 4 2 4 2"/></svg></div>`;

  const statusMap = {
    'pending': 'На проверке',
    'approved': 'Одобрено',
    'rejected': 'Отклонено'
  };

  return `
    <div class="request-card" onclick="openDrawer('${req.id}')">
      ${photoThumb}
      <div class="request-info">
        <div class="request-header">
          <div class="request-product">${req.product}</div>
          <span class="status-badge status-${req.status}">${statusMap[req.status]}</span>
        </div>
        <div class="request-meta">
          <span>${req.storeName}</span>
          <span>•</span>
          <span>${formattedDate}</span>
          <span>•</span>
          <span>Объем: ${req.qty}</span>
          ${req.deductionType === 'yes' ? `<span class="deduction-badge">С удержанием</span>` : ''}
          ${req.iikoSynced ? `<span style="color:var(--green)">✓ iiko</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ---- CSV Export Engine ----
function exportToCSV() {
  const processed = requests.filter(r => r.status !== 'pending');
  if (processed.length === 0) {
    showToast('Нет данных', 'Архив проверенных списаний пуст', 'error');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "ID;Дата;Автор;Магазин;Товар;Количество;Характер списания;Ответственный;Статус;Акт iiko;Комментарий\r\n";

  processed.forEach(r => {
    const dStr = new Date(r.date).toLocaleString('ru-RU');
    const typeStr = r.deductionType === 'yes' ? 'С удержанием' : 'Без удержания';
    const respEmp = r.deductionEmployeeName || '';
    const statusStr = r.status === 'approved' ? 'Одобрено' : 'Отклонено';
    const actId = r.iikoActId || '';
    const cleanComm = r.comment.replace(/[\r\n]+/g, " ").replace(/;/g, ",");

    csvContent += `"${r.id}";"${dStr}";"${r.author}";"${r.storeName}";"${r.product}";"${r.qty}";"${typeStr}";"${respEmp}";"${statusStr}";"${actId}";"${cleanComm}"\r\n`;
  });

  const uri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `writeoff-report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Экспорт выполнен', 'Отчет скачан в формате CSV', 'success');
}

// ---- Premium Toast Popups ----
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    'success': `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    'error': `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'warning': `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
    'info': `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    ${icons[type] || icons['info']}
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentNode.remove()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.2s reverse both';
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// ---- Background Notification & Event Simulator ----
function setupNotificationSimulator() {
  const items = ['Сэндвич Классический', 'Пончик клубничный', 'Кофе Американо 0.3л', 'Морковный кекс', 'Салат Цезарь'];
  const storesList = ['ТЦ «Северный»', 'ТЦ «Южный»', 'ТЦ «Восток»'];
  const employeesList = ['Козлов Дмитрий', 'Сидорова Елена', 'Новикова Ольга'];

  setInterval(() => {
    if (Math.random() > 0.85 && currentUser) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const randomStore = storesList[Math.floor(Math.random() * storesList.length)];
      const randomEmp = employeesList[Math.floor(Math.random() * employeesList.length)];
      const randomQty = `${Math.floor(1 + Math.random() * 5)} шт`;

      const simulatedReq = {
        id: `req-${Date.now()}`,
        author: randomEmp,
        storeId: 's3',
        storeName: randomStore,
        product: randomItem,
        qty: randomQty,
        deductionType: 'no',
        deductionEmployeeId: null,
        deductionEmployeeName: null,
        comment: 'Товар поврежден в процессе приемки на склад.',
        photo: null,
        photoFilter: 'none',
        status: 'pending',
        rejectReason: null,
        iikoSynced: false,
        iikoActId: null,
        date: new Date().toISOString()
      };

      // Add to database
      requests.unshift(simulatedReq);
      localStorage.setItem('requests', JSON.stringify(requests));

      // Append manager notification
      const simulatedNotif = {
        id: `notif-${Date.now()}`,
        title: 'Новая заявка на списание',
        message: `${randomEmp} создал заявку на ${randomItem} (${randomQty})`,
        date: new Date().toISOString(),
        read: false
      };
      notifications.unshift(simulatedNotif);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      // Update feed log
      updateLiveFeedText(`Сотрудник ${randomEmp} отправил запрос на списание ${randomItem} (${randomQty}).`);

      // Refresh Manager Views if logged in
      if (currentUser.role === 'manager') {
        updateManagerStats();
        if (document.getElementById('mgr-page-dashboard').classList.contains('active')) {
          renderManagerRecentRequests();
        } else if (document.getElementById('mgr-page-pending').classList.contains('active')) {
          renderManagerPendingRequests();
        }
        showToast('Поступило списание', `${randomEmp} отправил заявку на "${randomItem}"`, 'info');
      } else {
        updateEmployeeStats();
      }
    }
  }, 25000);
}
