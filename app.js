/* ==========================================================================
   SUPABASE CLIENT CONFIGURATION (HYBRID DATABASE ENGINE)
   ========================================================================== */
// Reemplaza estas credenciales con las de tu proyecto en Supabase para activar
// la base de datos real en tiempo real. Si se mantienen vacías, la aplicación
// funcionará en modo de demostración local de forma transparente.
const SUPABASE_URL = "https://tczshnwvlazfbrqxzule.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjenNobnd2bGF6ZmJycXh6dWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDU0ODQsImV4cCI6MjA5NTMyMTQ4NH0.Pkjv8A7CPKaWQsrDYSiJdqArY08aR8uBBsEGVBmqo30";

let supabaseClient = null;
let isSupabaseActive = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof supabase !== 'undefined') {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseActive = true;
        console.log("🟢 Conexión a Supabase inicializada con éxito.");
    } catch (error) {
        console.error("🔴 Error inicializando Supabase client:", error);
    }
} else {
    console.log("🟡 Supabase no configurado o no cargado. Ejecutando en modo de Demostración con datos locales.");
}

document.addEventListener('DOMContentLoaded', async () => {
    // Sincronizar timeline público desde Supabase al arrancar si está activo
    if (isSupabaseActive) {
        await syncFromSupabase();
    }

    // Initialize Application States & UI Triggers
    initRouter();
    initTheme();
    initEnrollment();
    initGallery();
    initPortal();
});

/* ==========================================================================
   1. SINGLE PAGE ROUTER (SPA MANAGER)
   ========================================================================== */
function initRouter() {
    const navLinks = document.querySelectorAll('.nav-link, .mob-link');
    const sections = document.querySelectorAll('.app-section');
    const mainHeader = document.getElementById('main-header');
    
    // Header shadow on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    // Mobile Menu Drawer Toggles
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            mobileNav.classList.toggle('open');
        });
    }

    // Link switcher
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = link.getAttribute('data-target');
            switchSection(targetSectionId);

            // Close mobile menu if active
            if (menuToggle && menuToggle.classList.contains('open')) {
                menuToggle.classList.remove('open');
                mobileNav.classList.remove('open');
            }
        });
    });

    // Portal direct triggers
    const portalTrigger = document.getElementById('portal-trigger');
    const mobilePortalTrigger = document.getElementById('mobile-portal-trigger');
    const heroPortalBtn = document.getElementById('hero-portal-btn');

    const handlePortalClick = (e) => {
        e.preventDefault();
        switchSection('portal-tab');
        if (menuToggle && menuToggle.classList.contains('open')) {
            menuToggle.classList.remove('open');
            mobileNav.classList.remove('open');
        }
    };

    if (portalTrigger) portalTrigger.addEventListener('click', handlePortalClick);
    if (mobilePortalTrigger) mobilePortalTrigger.addEventListener('click', handlePortalClick);
    if (heroPortalBtn) heroPortalBtn.addEventListener('click', handlePortalClick);

    // Initial logo click returns to home
    const navLogo = document.getElementById('nav-logo');
    if (navLogo) {
        navLogo.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection('hero-tab');
        });
    }
}

// Global section switcher helper
function switchSection(sectionId) {
    const sections = document.querySelectorAll('.app-section');
    const navLinks = document.querySelectorAll('.nav-link, .mob-link');
    
    // Deactivate all sections & activate target with smooth fade
    sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === sectionId) {
            sec.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Update navigation states in both menus
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === sectionId) {
            link.classList.add('active');
        }
    });

    // Custom portal header button status
    const portalTrigger = document.getElementById('portal-trigger');
    if (portalTrigger) {
        if (sectionId === 'portal-tab') {
            portalTrigger.style.boxShadow = '0 0 12px var(--accent-glow)';
            portalTrigger.style.filter = 'brightness(1.15)';
        } else {
            portalTrigger.style.boxShadow = '';
            portalTrigger.style.filter = '';
        }
    }
}

/* ==========================================================================
   2. LIGHT/DARK THEME ENGINE
   ========================================================================== */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Load user preference
    const savedTheme = localStorage.getItem('theme-preference') || 'dark';
    
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            body.classList.toggle('dark-theme');
            
            const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
            localStorage.setItem('theme-preference', currentTheme);
            
            // Re-render SVG chart if portal is open to adjust styling
            if (currentTheme && document.getElementById('portal-dashboard-view').classList.contains('hidden') === false) {
                renderFinancialChart();
            }
        });
    }
}

/* ==========================================================================
   3. TALLERES ENROLLMENT MANAGER
   ========================================================================== */
let activeWorkshopTitle = '';

function initEnrollment() {
    const modal = document.getElementById('enrollment-modal');
    const closeBtn = document.getElementById('close-enrollment-btn');
    const form = document.getElementById('enrollment-form');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });
        
        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get inputs
            const name = document.getElementById('student-name').value;
            
            // Close enrollment dialog
            if (modal) modal.classList.remove('open');
            
            // Trigger customized success Toast notification
            showToast(
                `¡Inscripción Exitosa!`,
                `Hola ${name}, te has inscrito al taller de ${activeWorkshopTitle}. Pronto nos contactaremos.`
            );
            
            // Reset input values
            form.reset();
        });
    }
}

function openEnrollmentModal(workshopName) {
    activeWorkshopTitle = workshopName;
    const modal = document.getElementById('enrollment-modal');
    const modalTitle = document.getElementById('enrollment-workshop-title');
    
    if (modal && modalTitle) {
        modalTitle.textContent = workshopName;
        modal.classList.add('open');
    }
}

/* ==========================================================================
   4. INTERACTIVE PHOTO GALLERY & LIGHTBOX
   ========================================================================== */
function initGallery() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('gallery-lightbox');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');

    // Gallery Category Filtering
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Set active class on filter tags
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const categoryFilter = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (categoryFilter === 'all' || itemCategory === categoryFilter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Lightbox modal opener
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const title = item.querySelector('h4').textContent;
            const desc = item.querySelector('p').textContent;
            const date = item.querySelector('.gallery-date').textContent;
            const tag = item.getAttribute('data-category');
            
            // Check for a real img element first
            const imgElement = item.querySelector('img.gallery-img');
            const imgUrl = imgElement ? imgElement.getAttribute('src') : null;
            
            let visualClasses = '';
            let iconClass = '';
            
            if (!imgUrl) {
                // Extract the background visual element details (fallback to gradient)
                const visualBg = item.querySelector('.gallery-visual-bg');
                if (visualBg) {
                    visualClasses = visualBg.className;
                    const iconElement = visualBg.querySelector('i');
                    if (iconElement) {
                        iconClass = iconElement.className;
                    }
                }
            }
            
            openLightbox(title, desc, date, tag, visualClasses, iconClass, imgUrl);
        });
    });

    if (closeLightboxBtn && lightbox) {
        closeLightboxBtn.addEventListener('click', () => {
            lightbox.classList.remove('open');
        });
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('open');
            }
        });
    }
}

function openLightbox(title, desc, date, tag, visualClasses, iconClass, imgUrl = null) {
    const lightbox = document.getElementById('gallery-lightbox');
    const lbTitle = document.getElementById('lightbox-title');
    const lbDesc = document.getElementById('lightbox-desc');
    const lbTag = document.getElementById('lightbox-tag');
    const lbBg = document.getElementById('lightbox-bg-element');
    const lbIcon = document.getElementById('lightbox-icon');

    if (lightbox && lbTitle && lbDesc && lbTag && lbBg && lbIcon) {
        lbTitle.textContent = title;
        lbDesc.textContent = `${desc} - Publicado el ${date}`;
        
        // Capitalize tag
        const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ');
        lbTag.textContent = formattedTag;
        
        if (imgUrl) {
            // Apply real image styling
            lbBg.className = 'lightbox-photo-bg has-image';
            lbBg.style.backgroundImage = `url('${imgUrl}')`;
            lbIcon.style.display = 'none';
        } else {
            // Fallback to gradient & icon
            lbBg.className = `lightbox-photo-bg ${visualClasses.replace('gallery-visual-bg', '')}`;
            lbBg.style.backgroundImage = '';
            lbIcon.className = iconClass;
            lbIcon.style.display = 'block';
        }
        
        lightbox.classList.add('open');
    }
}

/* ==========================================================================
   5. PORTAL PRIVADO DE SOCIOS - BASE DE DATOS Y ESTADO DEL USUARIO
   ========================================================================== */// Database of members and their payment status
let MEMBERS_DATABASE = {
    "admin": {
        name: "Administrador General",
        role: "Administrador General",
        password: "admin123",
        quotas: [
            { month: "Ene", status: "paid" },
            { month: "Feb", status: "paid" },
            { month: "Mar", status: "paid" },
            { month: "Abr", status: "paid" },
            { month: "May", status: "paid" },
            { month: "Jun", status: "pending" },
            { month: "Jul", status: "pending" },
            { month: "Ago", status: "pending" },
            { month: "Sep", status: "pending" },
            { month: "Oct", status: "pending" },
            { month: "Nov", status: "pending" },
            { month: "Dic", status: "pending" }
        ]
    },
    "patricia": {
        name: "Patricia Araya",
        role: "Socio Activo",
        password: "cueca123",
        quotas: [
            { month: "Ene", status: "paid" },
            { month: "Feb", status: "paid" },
            { month: "Mar", status: "paid" },
            { month: "Abr", status: "paid" },
            { month: "May", status: "paid" },
            { month: "Jun", status: "pending" },
            { month: "Jul", status: "pending" },
            { month: "Ago", status: "pending" },
            { month: "Sep", status: "pending" },
            { month: "Oct", status: "pending" },
            { month: "Nov", status: "pending" },
            { month: "Dic", status: "pending" }
        ]
    },
    "juan": {
        name: "Juan Pérez Muñoz",
        role: "Socio Inicial",
        password: "cueca123",
        quotas: [
            { month: "Ene", status: "paid" },
            { month: "Feb", status: "paid" },
            { month: "Mar", status: "overdue" },
            { month: "Abr", status: "pending" },
            { month: "May", status: "pending" },
            { month: "Jun", status: "pending" },
            { month: "Jul", status: "pending" },
            { month: "Ago", status: "pending" },
            { month: "Sep", status: "pending" },
            { month: "Oct", status: "pending" },
            { month: "Nov", status: "pending" },
            { month: "Dic", status: "pending" }
        ]
    },
    "camila": {
        name: "Camila Toro Rojas",
        role: "Bailarina Elenco",
        password: "cueca123",
        quotas: [
            { month: "Ene", status: "paid" },
            { month: "Feb", status: "paid" },
            { month: "Mar", status: "paid" },
            { month: "Abr", status: "paid" },
            { month: "May", status: "paid" },
            { month: "Jun", status: "paid" },
            { month: "Jul", status: "pending" },
            { month: "Ago", status: "pending" },
            { month: "Sep", status: "pending" },
            { month: "Oct", status: "pending" },
            { month: "Nov", status: "pending" },
            { month: "Dic", status: "pending" }
        ]
    },
    "directiva2026": {
        name: "Pablina Oyarzún (Presidenta)",
        role: "Directiva Administrador",
        password: "patria123",
        quotas: [
            { month: "Ene", status: "paid" },
            { month: "Feb", status: "paid" },
            { month: "Mar", status: "paid" },
            { month: "Abr", status: "paid" },
            { month: "May", status: "paid" },
            { month: "Jun", status: "pending" },
            { month: "Jul", status: "pending" },
            { month: "Ago", status: "pending" },
            { month: "Sep", status: "pending" },
            { month: "Oct", status: "pending" },
            { month: "Nov", status: "pending" },
            { month: "Dic", status: "pending" }
        ]
    }
};
// Current Session Info
let activeUser = {
    username: "",
    role: "", // "socio" or "directiva"
    memberName: "",
    activeMemberKey: "patricia" // member actively viewed in panels
};

// News and Agreements Mock Array
let MOCK_NEWS_AGREEMENTS = [
    {
        id: 1,
        date: "20 Mayo, 2026",
        type: "noticia",
        title: "Lanzamiento oficial de Rifa Invernal 2026",
        content: "Estimados socios, a partir de hoy se inicia la distribución de los talonarios para la rifa anual de invierno. Cada socio tiene asignado un talonario de 10 números con el fin de juntar fondos para renovar los calzados de cueca tradicionales de nuestro elenco oficial.",
        decisions: "Se acuerda que el valor del número será de $2.000 pesos y el sorteo se realizará el Sábado 18 de Julio en nuestra peña."
    },
    {
        id: 2,
        date: "12 Mayo, 2026",
        type: "acuerdo",
        title: "Acta Asamblea Extraordinaria: Confección de Vestuario",
        content: "En la sesión ordinaria del mes de Mayo, se discutió la cotización para los nuevos vestidos de china y chamantos huasos para los jóvenes de la agrupación. Tras analizar 3 presupuestos de talleres locales de La Ligua, se ha tomado una definición de compra.",
        decisions: "Votación aprobada unánimemente: Se contratará a la tejedora local Sra. Rosa Díaz para confeccionar 8 chamantos de telar, y a Confecciones Petorca para 10 vestidos floreados clásicos."
    },
    {
        id: 3,
        date: "28 Abril, 2026",
        type: "acuerdo",
        title: "Acuerdo de Apoyo Municipal para Gala de Fiestas Patrias",
        content: "Se sostuvo reunión protocolar con el encargado de Cultura de la Ilustre Municipalidad de La Ligua. La municipalidad se compromete con la amplificación completa, escenario y permisos de uso de suelo en la Plaza de Armas sin costo.",
        decisions: "Acuerdo pactado: La agrupación aportará con el show artístico de 90 minutos y se autoriza la venta de empanadas y jugos a beneficio de nuestro club folclórico."
    },
    {
        id: 4,
        date: "14 Abril, 2026",
        type: "noticia",
        title: "Bienvenida a nuevos socios y balance inicial",
        content: "Queremos dar una afectuosa bienvenida a las 6 nuevas familias que se integraron a nuestros talleres de iniciación y han solicitado incorporarse como socios activos de la agrupación Alma y Corazón Cuequera. ¡A zapatear con el alma!",
        decisions: "Integración formal al registro de cuotas a contar del mes de Mayo 2026."
    },
    {
        id: 5,
        date: "10 Marzo, 2026",
        type: "acuerdo",
        title: "Planificación de Cuota Social Anual 2026",
        content: "En la asamblea general de inicio de año, la directiva propuso mantener congelada la cuota mensual de socios activos para fomentar la participación de la comunidad tras los gastos de marzo.",
        decisions: "Acuerdo tomado: La cuota mensual se mantendrá en $5.000 pesos chilenos mensuales para el presente período 2026."
    }
];

// Base values for finance system (added to dynamically calculated ones)
const BASE_FINANCES = {
    ingresos: 2200000,
    egresos: 1230000,
    monthlyIngresosBase: [380000, 420000, 560000, 340000, 500000],
    monthlyEgresosBase: [250000, 300000, 320000, 180000, 180000]
};

/* ==========================================================================
   SUPABASE DATA SYNCHRONIZATION ENGINE (ASYNC QUERIES)
   ========================================================================== */

// 1. Sync all data from Supabase
async function syncFromSupabase() {
    if (!isSupabaseActive) return;

    try {
        console.log("🔄 Sincronizando datos desde Supabase...");

        // A. Fetch members
        const { data: members, error: mError } = await supabaseClient
            .from('members')
            .select('*');
        if (mError) throw mError;

        // B. Fetch quotas
        const { data: quotas, error: qError } = await supabaseClient
            .from('quotas')
            .select('*')
            .order('month_order', { ascending: true });
        if (qError) throw qError;

        // C. Fetch agreements & news
        const { data: agreements, error: aError } = await supabaseClient
            .from('agreements_news')
            .select('*')
            .order('id', { ascending: false });
        if (aError) throw aError;

        // D. Fetch timeline events
        const { data: timelineEvents, error: tError } = await supabaseClient
            .from('timeline_events')
            .select('*')
            .order('id', { ascending: false });
        if (tError) throw tError;

        // Reconstruct MEMBERS_DATABASE from Supabase tables
        const newMembersDb = {};
        members.forEach(member => {
            newMembersDb[member.id] = {
                name: member.name,
                role: member.role,
                quotas: []
            };
        });

        quotas.forEach(quota => {
            if (newMembersDb[quota.member_id]) {
                newMembersDb[quota.member_id].quotas.push({
                    month: quota.month,
                    status: quota.status
                });
            }
        });

        // Update local variables
        MEMBERS_DATABASE = newMembersDb;

        if (agreements && agreements.length > 0) {
            MOCK_NEWS_AGREEMENTS = agreements.map(item => ({
                id: item.id,
                date: item.date,
                type: item.type,
                title: item.title,
                content: item.content,
                decisions: item.decisions
            }));
        }

        // Render dynamic timeline if events are present
        if (timelineEvents && timelineEvents.length > 0) {
            const timelineElement = document.querySelector('#eventos-tab .timeline');
            if (timelineElement) {
                timelineElement.innerHTML = '';
                timelineEvents.forEach(evt => {
                    const newItemHtml = `
                        <div class="timeline-item">
                            <div class="timeline-date">${evt.date}</div>
                            <div class="timeline-content">
                                <h4>${evt.title}</h4>
                                <p class="time-loc"><i class="fa-solid fa-clock"></i> ${evt.time}</p>
                                <p>${evt.description}</p>
                            </div>
                        </div>
                    `;
                    timelineElement.insertAdjacentHTML('beforeend', newItemHtml);
                });
            }
        }

        console.log("🟢 Sincronización con Supabase completada con éxito.");
    } catch (err) {
        console.error("🔴 Error sincronizando con Supabase, usando modo local:", err);
    }
}

// 2. Save quota changes to Supabase
async function saveQuotaToSupabase(memberKey, month, status) {
    if (!isSupabaseActive) return;

    try {
        const { error } = await supabaseClient
            .from('quotas')
            .update({ status: status })
            .eq('member_id', memberKey)
            .eq('month', month);

        if (error) throw error;
        console.log(`💾 Cuota de ${memberKey} para ${month} guardada en Supabase.`);
    } catch (err) {
        console.error("🔴 Error al guardar cuota en Supabase:", err);
    }
}

// 3. Save new news/agreement to Supabase
async function saveAgreementToSupabase(date, type, title, content, decisions) {
    if (!isSupabaseActive) return;

    try {
        const { error } = await supabaseClient
            .from('agreements_news')
            .insert([{
                date: date,
                type: type,
                title: title,
                content: content,
                decisions: decisions
            }]);

        if (error) throw error;
        console.log("💾 Acuerdo/Noticia publicado en Supabase.");
    } catch (err) {
        console.error("🔴 Error al publicar acuerdo en Supabase:", err);
    }
}

// 4. Save public event to Supabase
async function saveEventToSupabase(date, time, title, description) {
    if (!isSupabaseActive) return;

    try {
        const { error } = await supabaseClient
            .from('timeline_events')
            .insert([{
                date: date,
                time: time,
                title: title,
                description: description
            }]);

        if (error) throw error;
        console.log("💾 Evento de agenda publicado en Supabase.");
    } catch (err) {
        console.error("🔴 Error al guardar evento en Supabase:", err);
    }
}

function initPortal() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error-msg');
    const quickLoginBtn = document.getElementById('btn-quick-login');
    const quickLoginBtnAdmin = document.getElementById('btn-quick-login-admin');
    const logoutBtn = document.getElementById('btn-dashboard-logout');
    const passwordInput = document.getElementById('password');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    
    // Toggle Password Visibility
    if (togglePwdBtn && passwordInput) {
        togglePwdBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = togglePwdBtn.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Portal login submit validation
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim().toLowerCase();
            const password = passwordInput.value.trim();

            if (isSupabaseActive) {
                try {
                    // Consultar Supabase directamente para ver si existe el usuario con su contraseña
                    const { data: members, error } = await supabaseClient
                        .from('members')
                        .select('*')
                        .eq('id', username)
                        .eq('password', password);

                    if (error) throw error;

                    if (members && members.length > 0) {
                        const user = members[0];
                        const userRole = user.role.toLowerCase();
                        const isDir = userRole.includes('directiva') || userRole.includes('administrador');
                        await loginSuccess(isDir ? 'directiva' : 'socio', user.id);
                    } else {
                        loginError.classList.remove('hidden');
                    }
                } catch (err) {
                    console.error("🔴 Error de autenticación en Supabase:", err);
                    loginError.classList.remove('hidden');
                }
            } else {
                // Modo Demo Local: Buscar en MEMBERS_DATABASE
                const member = MEMBERS_DATABASE[username];
                if (member && member.password === password) {
                    const isDir = member.role.toLowerCase().includes('directiva') || member.role.toLowerCase().includes('administrador');
                    loginSuccess(isDir ? 'directiva' : 'socio', username);
                } else {
                    // Fallback para accesos demo legacy
                    if (username === 'socio2026' && password === 'cueca123') {
                        loginSuccess('socio', 'patricia');
                    } else if (username === 'directiva2026' && password === 'patria123') {
                        loginSuccess('directiva', 'directiva2026');
                    } else {
                        loginError.classList.remove('hidden');
                    }
                }
            }
        });
    }

    // Quick Login Demo Triggers
    if (quickLoginBtn) {
        quickLoginBtn.addEventListener('click', () => {
            loginSuccess('socio', 'patricia');
        });
    }
    if (quickLoginBtnAdmin) {
        quickLoginBtnAdmin.addEventListener('click', () => {
            loginSuccess('directiva', 'directiva2026');
        });
    }
    const quickLoginBtnSuper = document.getElementById('btn-quick-login-super');
    if (quickLoginBtnSuper) {
        quickLoginBtnSuper.addEventListener('click', () => {
            loginSuccess('directiva', 'admin');
        });
    }

    // Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            performLogout();
        });
    }

    // Live news search query action
    const searchInput = document.getElementById('news-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            renderAgreementsList(query);
        });
    }

    // Initialize Administration panel tabs
    const adminTabs = document.querySelectorAll('.admin-tab-btn');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTabContent = tab.getAttribute('data-tab');
            const contents = document.querySelectorAll('.admin-sub-content');
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTabContent) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Admin member dropdown selector
    const memberSelect = document.getElementById('admin-member-select');
    if (memberSelect) {
        memberSelect.addEventListener('change', () => {
            activeUser.activeMemberKey = memberSelect.value;
            const activeMemberNameLabel = document.getElementById('admin-active-member-name');
            const member = MEMBERS_DATABASE[activeUser.activeMemberKey];
            if (activeMemberNameLabel && member) {
                activeMemberNameLabel.textContent = member.name;
            }
            
            // If logged in as socio, this changes their personal card instantly
            if (activeUser.role === 'socio' && member) {
                // Not standard (Socio has only one profile), but great for evaluating database in demo mode!
                document.getElementById('db-user-name').textContent = member.name;
                document.getElementById('db-user-role').textContent = member.role;
            }

            populateQuotasGrid();
            populateAdminQuotaGrid();
        });
    }

    // Admin Forms Submit Intercepts
    const newsForm = document.getElementById('admin-add-news-form');
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('admin-news-title').value;
            const type = document.getElementById('admin-news-type').value;
            const content = document.getElementById('admin-news-content').value;
            const decisions = document.getElementById('admin-news-decisions').value;

            // Generate clean date string
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const dateStr = new Date().toLocaleDateString('es-CL', options);

            // Guardar en Supabase si está activo
            if (isSupabaseActive) {
                await saveAgreementToSupabase(dateStr, type, title, content, decisions);
                await syncFromSupabase();
            } else {
                // Prepend new agreement object to the news feed localmente
                MOCK_NEWS_AGREEMENTS.unshift({
                    id: Date.now(),
                    date: dateStr,
                    type: type,
                    title: title,
                    content: content,
                    decisions: decisions
                });
            }

            // Re-render
            renderAgreementsList();
            newsForm.reset();
            
            showToast("¡Publicado con éxito!", "El acta/boletín ha sido agregada a la bitácora privada de socios.");
        });
    }

    const eventForm = document.getElementById('admin-add-event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('admin-event-title').value;
            const date = document.getElementById('admin-event-date').value;
            const time = document.getElementById('admin-event-time').value;
            const desc = document.getElementById('admin-event-desc').value;

            if (isSupabaseActive) {
                await saveEventToSupabase(date, time, title, desc);
                await syncFromSupabase();
            } else {
                // Add new timeline element to the public Timeline inside eventos-tab localmente
                const timelineElement = document.querySelector('#eventos-tab .timeline');
                if (timelineElement) {
                    const newItemHtml = `
                        <div class="timeline-item">
                            <div class="timeline-date">${date}</div>
                            <div class="timeline-content">
                                <h4>${title}</h4>
                                <p class="time-loc"><i class="fa-solid fa-clock"></i> ${time}</p>
                                <p>${desc}</p>
                            </div>
                        </div>
                    `;
                    timelineElement.insertAdjacentHTML('afterbegin', newItemHtml);
                }
            }

            eventForm.reset();
            showToast("¡Evento Creado!", "La actividad ha sido publicada en la agenda pública de eventos.");
        });
    }

    // Formulario de Creación de Nuevos Socios por la Directiva
    const createMemberForm = document.getElementById('admin-create-member-form');
    if (createMemberForm) {
        createMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-new-member-name').value.trim();
            const username = document.getElementById('admin-new-member-username').value.trim().toLowerCase();
            const role = document.getElementById('admin-new-member-role').value;
            const password = document.getElementById('admin-new-member-pwd').value.trim();

            if (MEMBERS_DATABASE[username]) {
                showToast("Error de Registro", "El nombre de usuario ya existe. Elige uno diferente.");
                return;
            }

            // 1. Generar conjunto de 12 cuotas pendientes para 2026
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const quotas = months.map(m => ({ month: m, status: 'pending' }));

            // 2. Guardar en Supabase si está activo
            if (isSupabaseActive) {
                try {
                    // A. Insertar miembro
                    const { error: mError } = await supabaseClient
                        .from('members')
                        .insert([{ id: username, name: name, role: role, password: password }]);
                    if (mError) throw mError;

                    // B. Insertar 12 cuotas
                    const quotaRows = months.map((m, idx) => ({
                        member_id: username,
                        month: m,
                        status: 'pending',
                        month_order: idx + 1
                    }));

                    const { error: qError } = await supabaseClient
                        .from('quotas')
                        .insert(quotaRows);
                    if (qError) throw qError;

                    console.log(`🟢 Socio ${username} y sus cuotas insertados en Supabase.`);
                    await syncFromSupabase();
                } catch (err) {
                    console.error("🔴 Error registrando socio en Supabase:", err);
                    showToast("Error de Servidor", "No se pudo guardar el socio en la base de datos.");
                    return;
                }
            } else {
                // Registrar localmente en modo Demo
                MEMBERS_DATABASE[username] = {
                    name: name,
                    role: role,
                    password: password,
                    quotas: quotas
                };
            }

            // 3. Actualizar dinámicamente el selector dropdown de miembros en el panel
            const memberSelect = document.getElementById('admin-member-select');
            if (memberSelect) {
                const opt = document.createElement('option');
                opt.value = username;
                opt.textContent = `${name} (${role})`;
                memberSelect.appendChild(opt);
            }

            // Resetear formulario y dar feedback
            createMemberForm.reset();
            
            // Re-renderizar cuotas y resúmenes para reflejar al nuevo miembro en balances de caja generales
            updateFinancialSummaryAndChart();
            
            showToast("¡Socio Registrado!", `El socio ${name} fue registrado con éxito. Clave: ${password}`);
        });
    }

    // Admin delete member button
    const deleteMemberBtn = document.getElementById('btn-admin-delete-member');
    if (deleteMemberBtn) {
        deleteMemberBtn.addEventListener('click', async () => {
            const memberKey = activeUser.activeMemberKey;
            
            // Protect core accounts from deletion
            if (memberKey === 'directiva2026' || memberKey === 'admin' || memberKey === 'patricia') {
                showToast("Acción Bloqueada", "No puedes eliminar las cuentas administrativas ni de socios históricos principales.");
                return;
            }
            
            const member = MEMBERS_DATABASE[memberKey];
            if (!member) return;
            
            const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar al socio ${member.name} (${member.role})? Esta acción es definitiva y borrará todo su historial de cuotas.`);
            if (!confirmDelete) return;
            
            if (isSupabaseActive) {
                try {
                    const { error } = await supabaseClient
                        .from('members')
                        .delete()
                        .eq('id', memberKey);
                    
                    if (error) throw error;
                    console.log(`🗑️ Socio ${memberKey} eliminado de Supabase.`);
                    await syncFromSupabase();
                } catch (err) {
                    console.error("🔴 Error eliminando socio de Supabase:", err);
                    showToast("Error de Servidor", "No se pudo eliminar el socio de la base de datos.");
                    return;
                }
            } else {
                // Delete locally
                delete MEMBERS_DATABASE[memberKey];
            }
            
            // Refresh member selector
            const select = document.getElementById('admin-member-select');
            if (select) {
                // Find option and remove it
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value === memberKey) {
                        select.remove(i);
                        break;
                    }
                }
                
                // Select first available member
                if (select.options.length > 0) {
                    select.selectedIndex = 0;
                    activeUser.activeMemberKey = select.value;
                    document.getElementById('admin-active-member-name').textContent = MEMBERS_DATABASE[select.value] ? MEMBERS_DATABASE[select.value].name : select.value;
                } else {
                    activeUser.activeMemberKey = '';
                    document.getElementById('admin-active-member-name').textContent = 'Ninguno';
                }
            }
            
            // Re-render
            populateQuotasGrid();
            populateAdminQuotaGrid();
            updateFinancialSummaryAndChart();
            
            showToast("Socio Eliminado", `El socio ${member.name} ha sido borrado del sistema.`);
        });
    }
}

async function loginSuccess(role, memberKey = null) {
    document.getElementById('portal-login-view').classList.add('hidden');
    document.getElementById('portal-dashboard-view').classList.remove('hidden');
    document.getElementById('login-error-msg').classList.add('hidden');
    
    // Set user profile
    if (role === 'directiva') {
        const key = memberKey || "directiva2026";
        const member = MEMBERS_DATABASE[key] || { name: "Pablina Oyarzún (Presidenta)", role: "Directiva Administrador" };
        activeUser = {
            username: key,
            role: "directiva",
            memberName: member.name,
            activeMemberKey: "patricia" // default viewed member in selector
        };
        // Show Admin controls
        document.getElementById('directiva-admin-panel').classList.remove('hidden');
        document.getElementById('db-user-name').textContent = activeUser.memberName;
        document.getElementById('db-user-role').textContent = member.role;
        
        // Reset admin member selector dynamically from MEMBERS_DATABASE
        const select = document.getElementById('admin-member-select');
        if (select) {
            select.innerHTML = '';
            Object.keys(MEMBERS_DATABASE).forEach(key => {
                if (key !== 'directiva2026' && MEMBERS_DATABASE[key]) {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = `${MEMBERS_DATABASE[key].name || key} (${MEMBERS_DATABASE[key].role || ''})`;
                    select.appendChild(opt);
                }
            });
            
            const keys = Object.keys(MEMBERS_DATABASE).filter(k => k !== 'directiva2026');
            if (keys.length > 0) {
                const defaultKey = keys.includes('patricia') ? 'patricia' : keys[0];
                select.value = defaultKey;
                activeUser.activeMemberKey = defaultKey;
                document.getElementById('admin-active-member-name').textContent = MEMBERS_DATABASE[defaultKey] ? MEMBERS_DATABASE[defaultKey].name : defaultKey;
            }
        }
    } else {
        const key = memberKey || "patricia";
        const member = MEMBERS_DATABASE[key] || { name: "Patricia Araya", role: "Socio Activo" };
        activeUser = {
            username: key,
            role: "socio",
            memberName: member.name,
            activeMemberKey: key
        };
        // Hide Admin controls
        document.getElementById('directiva-admin-panel').classList.add('hidden');
        document.getElementById('db-user-name').textContent = activeUser.memberName;
        document.getElementById('db-user-role').textContent = member.role;
    }

    // Populate calendar date
    const dateLabel = document.getElementById('current-date');
    if (dateLabel) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateLabel.innerHTML = `<i class="fa-solid fa-clock"></i> Sesión activa · ${new Date().toLocaleDateString('es-CL', options)}`;
    }

    // Sincronizar datos reales de Supabase si está activo
    if (isSupabaseActive) {
        await syncFromSupabase();
    }

    // Render all dashboard submodules
    populateQuotasGrid();
    populateAdminQuotaGrid();
    updateFinancialSummaryAndChart();
    renderAgreementsList();
    
    // Reset login form
    document.getElementById('login-form').reset();
    
    showToast("¡Bienvenido al Portal!", `Sesión iniciada como ${activeUser.memberName}.`);
}

function performLogout() {
    document.getElementById('portal-dashboard-view').classList.add('hidden');
    document.getElementById('portal-login-view').classList.remove('hidden');
    
    activeUser = { username: "", role: "", memberName: "", activeMemberKey: "patricia" };
    
    showToast("Sesión Cerrada", "Has salido del portal de socios. Vuelve pronto.");
}

/* ==========================================================================
   6. DASHBOARD SUBMODULES POPULATORS & CALCULATIONS
   ========================================================================== */

// A. Populates the personal quotas grid
function populateQuotasGrid() {
    const grid = document.getElementById('months-grid');
    if (!grid) return;
    grid.innerHTML = ''; // clear grid

    const activeMember = MEMBERS_DATABASE[activeUser.activeMemberKey] || { name: "Socio", role: "Socio", quotas: [] };
    const quotasToRender = activeMember.quotas || [];
    quotasToRender.forEach(quota => {
        const card = document.createElement('div');
        
        let statusClass = 'pending';
        let statusIcon = '<i class="fa-solid fa-clock badge-icon"></i>';
        let tooltip = 'Por pagar ($5.000)';

        if (quota.status === 'paid') {
            statusClass = 'paid';
            statusIcon = '<i class="fa-solid fa-circle-check badge-icon"></i>';
            tooltip = 'Aportado ($5.000)';
        } else if (quota.status === 'overdue') {
            statusClass = 'overdue';
            statusIcon = '<i class="fa-solid fa-triangle-exclamation badge-icon"></i>';
            tooltip = 'Pendiente atrasado';
        }

        card.className = `month-badge ${statusClass}`;
        card.setAttribute('title', `${quota.month}: ${tooltip}`);
        card.innerHTML = `
            <span>${quota.month}</span>
            ${statusIcon}
        `;
        
        grid.appendChild(card);
    });

    // Calculate sum statistics dynamically
    const paidCount = quotasToRender.filter(q => q.status === 'paid').length;
    const totalAmount = paidCount * 5000;
    const remainingAmount = (12 - paidCount) * 5000;

    document.getElementById('quota-paid-count').textContent = `${paidCount} / 12`;
    document.getElementById('quota-total-amount').textContent = `$${totalAmount.toLocaleString('es-CL')}`;
    document.getElementById('quota-rem-amount').textContent = `$${remainingAmount.toLocaleString('es-CL')}`;

    // Adjust badge status based on overdue or not
    const hasOverdue = quotasToRender.some(q => q.status === 'overdue');
    const badge = document.querySelector('#quota-status-card .badge');
    if (badge) {
        if (hasOverdue) {
            badge.className = "badge badge-advanced";
            badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Con Retraso`;
        } else {
            badge.className = "badge badge-active";
            badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Al Día (${quotasToRender[4] ? quotasToRender[4].month : 'May'})`;
        }
    }
}

// B. Populate the Admin Interactive Quota Editor Grid
function populateAdminQuotaGrid() {
    const grid = document.getElementById('admin-quota-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const activeMember = MEMBERS_DATABASE[activeUser.activeMemberKey] || { name: "Socio", role: "Socio", quotas: [] };
    const quotasToRender = activeMember.quotas || [];
    quotasToRender.forEach((quota, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        
        let statusClass = 'pending';
        let statusIcon = '<i class="fa-solid fa-clock"></i>';
        
        if (quota.status === 'paid') {
            statusClass = 'paid';
            statusIcon = '<i class="fa-solid fa-circle-check"></i>';
        } else if (quota.status === 'overdue') {
            statusClass = 'overdue';
            statusIcon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        }

        btn.className = `admin-quota-btn ${statusClass}`;
        btn.innerHTML = `
            <span>${quota.month}</span>
            ${statusIcon}
        `;

        // Click cycles through payment status: paid -> pending -> overdue -> paid
        btn.addEventListener('click', async () => {
            let nextStatus = 'pending';
            if (quota.status === 'paid') {
                nextStatus = 'pending';
            } else if (quota.status === 'pending') {
                nextStatus = 'overdue';
            } else if (quota.status === 'overdue') {
                nextStatus = 'paid';
            }

            // Update database
            quota.status = nextStatus;

            // Guardar en Supabase si está activo
            if (isSupabaseActive) {
                await saveQuotaToSupabase(activeUser.activeMemberKey, quota.month, nextStatus);
            }

            // Re-render grids
            populateQuotasGrid();
            populateAdminQuotaGrid();
            updateFinancialSummaryAndChart();

            showToast(
                "Cuota Actualizada",
                `Se modificó ${quota.month} de ${activeMember.name} a: ${nextStatus.toUpperCase()}`
            );
        });

        grid.appendChild(btn);
    });
}

// C. Update total metrics and financial charts dynamically based on paid quotas
function updateFinancialSummaryAndChart() {
    // 1. Calculate paid sum across ALL members in memory
    let totalPaidQuotasSum = 0;
    
    // Explicit members
    Object.keys(MEMBERS_DATABASE).forEach(key => {
        const member = MEMBERS_DATABASE[key];
        if (member && member.quotas) {
            const paidCount = member.quotas.filter(q => q.status === 'paid').length;
            totalPaidQuotasSum += paidCount * 5000;
        }
    });

    // Dynamic metrics
    const finalIngresos = BASE_FINANCES.ingresos + totalPaidQuotasSum;
    const finalEgresos = BASE_FINANCES.egresos;
    const netBalance = finalIngresos - finalEgresos;

    document.getElementById('fin-total-ingresos').textContent = `$${finalIngresos.toLocaleString('es-CL')}`;
    document.getElementById('fin-total-egresos').textContent = `$${finalEgresos.toLocaleString('es-CL')}`;
    
    const balanceLabel = document.getElementById('fin-net-balance');
    balanceLabel.textContent = `$${netBalance.toLocaleString('es-CL')}`;
    if (netBalance >= 0) {
        balanceLabel.className = 'fin-val text-green';
    } else {
        balanceLabel.className = 'fin-val text-red';
    }

    // 2. Redraw the SVG double-line chart incorporating these dynamically added values
    // We add a minor weight to Enero-Mayo based on payments
    renderFinancialChart(totalPaidQuotasSum);
}

// D. Render agreements list with keyword filters
function renderAgreementsList(filterQuery = '') {
    const container = document.getElementById('agreements-list');
    if (!container) return;
    container.innerHTML = '';

    const filtered = MOCK_NEWS_AGREEMENTS.filter(item => {
        if (!filterQuery) return true;
        return item.title.toLowerCase().includes(filterQuery) ||
               item.content.toLowerCase().includes(filterQuery) ||
               item.decisions.toLowerCase().includes(filterQuery) ||
               item.date.toLowerCase().includes(filterQuery);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-face-frown" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No se encontraron acuerdos ni noticias que coincidan con la búsqueda.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(news => {
        const card = document.createElement('div');
        card.className = 'agreement-card';
        
        const typeBadge = news.type === 'acuerdo' 
            ? `<span class="agr-type-badge badge-acuerdo"><i class="fa-solid fa-file-contract"></i> Acuerdo</span>`
            : `<span class="agr-type-badge badge-noticia"><i class="fa-solid fa-bullhorn"></i> Noticia</span>`;

        card.innerHTML = `
            <div class="agreement-top-meta">
                <span class="agr-date"><i class="fa-solid fa-calendar-day"></i> ${news.date}</span>
                ${typeBadge}
            </div>
            <h4>${news.title}</h4>
            <p>${news.content}</p>
            <div class="agreement-footer-decisions">
                <strong><i class="fa-solid fa-circle-check text-gold"></i> Acuerdo Consensuado:</strong>
                <span>${news.decisions}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// E. Dynamic Interactive SVG Chart Generator (Ingresos vs Egresos)
function renderFinancialChart(quotaSumOffset = 0) {
    const container = document.getElementById('svg-chart-container');
    if (!container) return;
    container.innerHTML = '';

    // Enero, Febrero, Marzo, Abril, Mayo
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'];
    
    // Add quota offset dynamically to the last month (Mayo) to show real-time changes!
    const ingresos = [...BASE_FINANCES.monthlyIngresosBase];
    ingresos[4] = BASE_FINANCES.monthlyIngresosBase[4] + quotaSumOffset;
    
    const egresos = [...BASE_FINANCES.monthlyEgresosBase];

    // Determine colors based on active theme
    const isLightTheme = document.body.classList.contains('light-theme');
    const gridColor = isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)';
    const axisColor = isLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)';
    const labelColor = isLightTheme ? 'hsl(222, 24%, 12%)' : 'hsl(40, 15%, 85%)';

    // SVG Layout coordinates
    const width = 600;
    const height = 240;
    const paddingLeft = 70;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Scale to the max dynamic value
    const maxValInArr = Math.max(...ingresos, ...egresos);
    const maxValue = Math.ceil(maxValInArr / 100000) * 100000;

    // Helper functions to convert coordinates
    const getX = (index) => paddingLeft + (index * (chartWidth / (months.length - 1)));
    const getY = (val) => paddingTop + chartHeight - ((val / maxValue) * chartHeight);

    // Build the SVG
    let svgHtml = `
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="overflow: visible;" xmlns="http://www.w3.org/2000/svg">
            <style>
                .chart-lbl { font-family: 'Outfit', sans-serif; font-size: 11px; fill: ${labelColor}; font-weight: 500; }
                .chart-axis { stroke: ${axisColor}; stroke-width: 1.5; }
                .chart-grid { stroke: ${gridColor}; stroke-width: 1; stroke-dasharray: 4 2; }
            </style>
    `;

    // 1. Horizontal grid lines
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
        const value = (maxValue / ticks) * i;
        const y = getY(value);
        
        svgHtml += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="chart-grid"/>`;
        svgHtml += `<text x="${paddingLeft - 12}" y="${y + 4}" class="chart-lbl" text-anchor="end">$${(value / 1000)}k</text>`;
    }

    // 2. Axis lines
    svgHtml += `<line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${paddingTop + chartHeight}" class="chart-axis" />`;
    svgHtml += `<line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" class="chart-axis" />`;

    // 3. Month labels
    months.forEach((month, index) => {
        const x = getX(index);
        svgHtml += `<text x="${x}" y="${paddingTop + chartHeight + 22}" class="chart-lbl" text-anchor="middle">${month}</text>`;
    });

    // 4. Ingresos Path line (Blue Line)
    let ingresosPoints = '';
    ingresos.forEach((val, index) => {
        ingresosPoints += `${getX(index)},${getY(val)} `;
    });
    svgHtml += `<polyline points="${ingresosPoints}" class="chart-line chart-line-ingreso" />`;

    // 5. Egresos Path line (Red Line)
    let egresosPoints = '';
    egresos.forEach((val, index) => {
        egresosPoints += `${getX(index)},${getY(val)} `;
    });
    svgHtml += `<polyline points="${egresosPoints}" class="chart-line chart-line-egreso" />`;

    // 6. Nodes & tooltip hooks
    // Ingresos
    ingresos.forEach((val, index) => {
        const x = getX(index);
        const y = getY(val);
        svgHtml += `
            <g class="chart-node-group">
                <circle cx="${x}" cy="${y}" r="6" class="chart-node chart-node-ingreso" 
                        onmouseover="showChartTooltip(event, '${months[index]}', 'Ingreso', ${val})" 
                        onmouseout="hideChartTooltip()"/>
            </g>
        `;
    });

    // Egresos
    egresos.forEach((val, index) => {
        const x = getX(index);
        const y = getY(val);
        svgHtml += `
            <g class="chart-node-group">
                <circle cx="${x}" cy="${y}" r="6" class="chart-node chart-node-egreso"
                        onmouseover="showChartTooltip(event, '${months[index]}', 'Egreso', ${val})" 
                        onmouseout="hideChartTooltip()"/>
            </g>
        `;
    });

    // Tooltip overlay
    svgHtml += `
        <g id="chart-tooltip" class="chart-tooltip-group" opacity="0">
            <rect id="tooltip-rect" x="0" y="0" width="130" height="46" rx="8" fill="rgba(15, 10, 8, 0.95)" stroke="var(--accent)" stroke-width="1.5"/>
            <text id="tooltip-title" x="12" y="18" font-family="'Outfit', sans-serif" font-size="10px" font-weight="600" fill="var(--accent)"></text>
            <text id="tooltip-value" x="12" y="34" font-family="'Inter', sans-serif" font-size="12px" font-weight="700" fill="#fff"></text>
        </g>
    `;

    svgHtml += `</svg>`;
    container.innerHTML = svgHtml;
}

// Global tooltip controller called inside the inline SVGs
window.showChartTooltip = function(event, month, type, value) {
    const tooltip = document.getElementById('chart-tooltip');
    const rect = document.getElementById('tooltip-rect');
    const title = document.getElementById('tooltip-title');
    const valText = document.getElementById('tooltip-value');

    if (!tooltip || !title || !valText || !rect) return;

    title.textContent = `${month.toUpperCase()} · ${type.toUpperCase()}`;
    valText.textContent = `$${value.toLocaleString('es-CL')}`;

    const svgElement = event.target.ownerSVGElement;
    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    
    const svgPoints = point.matrixTransform(svgElement.getScreenCTM().inverse());

    const tooltipWidth = 130;
    const tooltipHeight = 46;
    let tooltipX = svgPoints.x - (tooltipWidth / 2);
    let tooltipY = svgPoints.y - tooltipHeight - 12;

    if (tooltipX < 10) tooltipX = 10;
    if (tooltipX + tooltipWidth > 590) tooltipX = 590 - tooltipWidth;

    rect.setAttribute('x', tooltipX);
    rect.setAttribute('y', tooltipY);
    title.setAttribute('x', tooltipX + 12);
    title.setAttribute('y', tooltipY + 16);
    valText.setAttribute('x', tooltipX + 12);
    valText.setAttribute('y', tooltipY + 34);

    tooltip.setAttribute('opacity', '1');
};

window.hideChartTooltip = function() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.setAttribute('opacity', '0');
    }
};

/* ==========================================================================
   7. TOAST FEEDBACK NOTIFICATIONS SYSTEM
   ========================================================================== */
let toastTimeout;

function showToast(title, body) {
    const toast = document.getElementById('toast-success');
    const tTitle = document.getElementById('toast-title');
    const tBody = document.getElementById('toast-body');

    if (!toast || !tTitle || !tBody) return;

    clearTimeout(toastTimeout);

    tTitle.textContent = title;
    tBody.textContent = body;

    toast.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
        closeToast();
    }, 4500);
}

function closeToast() {
    const toast = document.getElementById('toast-success');
    if (toast) {
        toast.classList.add('hidden');
    }
}
