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
    } else {
        // En modo de demostración local, renderizar noticias iniciales públicas
        renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);
    }

    // Initialize Application States & UI Triggers
    initRouter();
    initTheme();
    initEnrollment();
    initGallery();
    initPortal();
    initCarousel();
    // initPromoPopup(); // Desactivado porque el campeonato ya finalizó
    initSponsorsCarousel();
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

            // Si el grid dinámico de la galería existe, refrescar los elementos usando renderGalleryGrid
            if (document.getElementById('gallery-grid')) {
                renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
            }

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

    // Botones de Navegación del Carrusel de Lightbox
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el clic cierre el modal
            navigateLightbox(-1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el clic cierre el modal
            navigateLightbox(1);
        });
    }

    // Soporte para Navegación con Teclado
    document.addEventListener('keydown', (e) => {
        if (lightbox && lightbox.classList.contains('open')) {
            if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            } else if (e.key === 'Escape') {
                lightbox.classList.remove('open');
            }
        }
    });

    // Renderizar galería inicial pública
    if (document.getElementById('gallery-grid')) {
        renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
    }

    // Inicializar listeners del modal de álbum
    initAlbumModalClose();
}

// Estado global para navegación carrusel de Lightbox
window.CURRENT_LIGHTBOX_ALBUM_PHOTOS = [];
window.CURRENT_LIGHTBOX_PHOTO_INDEX = 0;
window.LIGHTBOX_OPENING_FROM_ALBUM = false;

function openLightbox(title, desc, date, tag, visualClasses, iconClass, imgUrl = null, fromNavigation = false) {
    const lightbox = document.getElementById('gallery-lightbox');
    const lbTitle = document.getElementById('lightbox-title');
    const lbDesc = document.getElementById('lightbox-desc');
    const lbTag = document.getElementById('lightbox-tag');
    const lbBg = document.getElementById('lightbox-bg-element');
    const lbIcon = document.getElementById('lightbox-icon');
    const lbImg = document.getElementById('lightbox-img');
    const lbCounter = document.getElementById('lightbox-counter');

    if (!fromNavigation) {
        if (window.LIGHTBOX_OPENING_FROM_ALBUM) {
            window.LIGHTBOX_OPENING_FROM_ALBUM = false;
        } else {
            // Clic estándar en fotos fuera de álbumes (boletines, auspiciadores) - reset a foto única
            window.CURRENT_LIGHTBOX_ALBUM_PHOTOS = [{
                title: title,
                desc: desc,
                date: date,
                tag: tag,
                visualClasses: visualClasses,
                iconClass: iconClass,
                imgUrl: imgUrl
            }];
            window.CURRENT_LIGHTBOX_PHOTO_INDEX = 0;
        }
    }

    // Actualizar visibilidad de botones prev/next
    updateLightboxNavButtons();

    if (lightbox && lbTitle && lbDesc && lbTag && lbBg && lbIcon) {
        lbTitle.textContent = title;
        lbDesc.textContent = desc ? `${desc} - Publicado el ${date}` : `Publicado el ${date}`;
        
        // Capitalize tag
        const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ');
        lbTag.textContent = formattedTag;

        // Actualizar contador del pie de foto
        if (lbCounter) {
            if (window.CURRENT_LIGHTBOX_ALBUM_PHOTOS && window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length > 1) {
                lbCounter.textContent = `${window.CURRENT_LIGHTBOX_PHOTO_INDEX + 1} de ${window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length}`;
                lbCounter.style.display = 'inline-block';
            } else {
                lbCounter.style.display = 'none';
            }
        }
        
        if (imgUrl) {
            // Apply real image styling
            lbBg.className = 'lightbox-photo-bg has-image';
            if (lbImg) {
                lbImg.src = imgUrl;
                lbImg.alt = title;
            }
            lbIcon.style.display = 'none';
        } else {
            // Fallback to gradient & icon
            lbBg.className = `lightbox-photo-bg ${visualClasses.replace('gallery-visual-bg', '')}`;
            if (lbImg) {
                lbImg.src = '';
                lbImg.alt = '';
            }
            lbIcon.className = iconClass;
            lbIcon.style.display = 'block';
        }
        
        lightbox.classList.add('open');
    }
}

function updateLightboxNavButtons() {
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');
    if (prevBtn && nextBtn) {
        if (window.CURRENT_LIGHTBOX_ALBUM_PHOTOS && window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }
}

function navigateLightbox(direction) {
    if (!window.CURRENT_LIGHTBOX_ALBUM_PHOTOS || window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length <= 1) return;
    
    let newIndex = window.CURRENT_LIGHTBOX_PHOTO_INDEX + direction;
    if (newIndex < 0) {
        newIndex = window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length - 1;
    } else if (newIndex >= window.CURRENT_LIGHTBOX_ALBUM_PHOTOS.length) {
        newIndex = 0;
    }
    
    window.CURRENT_LIGHTBOX_PHOTO_INDEX = newIndex;
    const photo = window.CURRENT_LIGHTBOX_ALBUM_PHOTOS[newIndex];
    
    // Llamar a openLightbox conservando el estado del carrusel (fromNavigation = true)
    openLightbox(photo.title, photo.desc, photo.date, photo.tag, photo.visualClasses, photo.iconClass, photo.imgUrl, true);
}

/* ==========================================================================
   5. PORTAL PRIVADO DE SOCIOS - BASE DE DATOS Y ESTADO DEL USUARIO
   ========================================================================== */// Database of members and their payment status
let MEMBERS_DATABASE = {
    "admin": {
        name: "Administrador General",
        role: "Administrador General",
        password: "admin123",
        email: "admin@almaycorazon.cl",
        phone: "+56 9 7179 5185",
        dancer_details: "Administrador de Sistemas",
        is_first_login: false,
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
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
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
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
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
        email: "camila@almaycorazon.cl",
        phone: "+56 9 8888 7777",
        dancer_details: "Bailarina de Elenco Oficial",
        is_first_login: false,
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
        email: "pablina@almaycorazon.cl",
        phone: "+56 9 7179 5185",
        dancer_details: "Presidenta & Fundadora",
        is_first_login: false,
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
    "zaira.ibaceta": {
        name: "Zaira Ibaceta Vergara",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "violeta.navea": {
        name: "Violeta Navea Rojo",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "carolina.astudillo": {
        name: "Carolina Astudillo Astudillo",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "joselyn.zamora": {
        name: "Joselyn Zamora Arancibia",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "tamara.vilches": {
        name: "Tamara Vilches Espejo",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "estefania.olivares": {
        name: "Estefanía Olivares Chacana",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "yasna.espinoza": {
        name: "Yasna Espinoza Rojas",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "mayra.vega": {
        name: "Mayra Vega Navea",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "sebastian.valenzuela": {
        name: "Sebastián Valenzuela Fernández",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "stefanie.cepeda": {
        name: "Stefanie Cepeda Soto",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "johana.godoy": {
        name: "Johana Godoy Ordenes",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "nixa.iturra": {
        name: "Nixa Iturra Oyarzun",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "barbara.perez": {
        name: "Bárbara Pérez Barros",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "rudy.verdejo": {
        name: "Rudy Verdejo Arancibia",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "pablina.oyarzun": {
        name: "Pablina Oyarzun Fierro",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "gabriela.vega": {
        name: "Gabriela Vega Villaroel",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "vania.fernandez": {
        name: "Vania Fernández Oyarzun",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "nicool.vargas": {
        name: "Nicool Vargas Mencía",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "juana.saavedra": {
        name: "Juana Saavedra Miranda",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "kathia.vega": {
        name: "Kathia Vega Villaroel",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "javiera.fuentes": {
        name: "Javiera Fuentes Báez",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "danilo.cataldo": {
        name: "Danilo Cataldo Astudillo",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "violeta.espejo": {
        name: "Violeta Espejo Araya",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "luis.baez": {
        name: "Luis Báez Estay",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "ligia.fuentes": {
        name: "Ligia Fuentes Báez",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "leonel.chacana": {
        name: "Leonel Chacana Brito",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "karol.vargas": {
        name: "Karol Vargas Ponce",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "yohan.godoy": {
        name: "Yohan Godoy Olivares",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "javiera.ortiz": {
        name: "Javiera Ortiz Alarcón",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "claudia.alarcon": {
        name: "Claudia Alarcon Muñoz",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "leydi.oyanedel": {
        name: "Leydi Oyanedel",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "catherine.diaz": {
        name: "Catherine Díaz Tapia",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "priscila.arancibia": {
        name: "Priscila Arancibia Gómez",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "jose.vera": {
        name: "José Joaquín Vera",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
    "allison.poblete": {
        name: "Allison Poblete Flores",
        role: "Socio Activo",
        password: "cueca123",
        email: "",
        phone: "",
        dancer_details: "",
        is_first_login: true,
        quotas: [
            { month: "Ene", status: "pending" },
            { month: "Feb", status: "pending" },
            { month: "Mar", status: "pending" },
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
        date: "15 May 2026",
        type: "acuerdo",
        title: "Adquisición de Mantas de Telar Típicas",
        content: "La directiva ha cerrado el acuerdo con las artesanas locales de La Ligua para la confección de 12 mantas de telar de lana natural para el elenco de varones de la agrupación.",
        decisions: "Se aprueba el presupuesto de $450.000 para el anticipo del 50% de los materiales.",
        image_url: "img/logo.jpg",
        visibility: "interna"
    },
    {
        id: 2,
        date: "10 May 2026",
        type: "noticia",
        title: "Gran Convocatoria Talleres de Cueca 2026",
        content: "Queremos agradecer a toda la comunidad de La Ligua por el tremendo éxito en la jornada de inscripción presencial para nuestros talleres de cueca inicial y avanzado.",
        decisions: "Clases inician el próximo sábado 6 de junio a las 16:00 hrs en el Centro Comunitario.",
        image_url: "img/logo.jpg",
        visibility: "publica"
    }
];

// Base values for finance system (added to dynamically calculated ones)
const BASE_FINANCES = {
    ingresos: 0,
    egresos: 0,
    monthlyIngresosBase: [0, 0, 0, 0, 0],
    monthlyEgresosBase: [0, 0, 0, 0, 0]
};

// Historial de transacciones de contabilidad (ingresos y egresos)
const DEFAULT_ACCOUNTING_TRANSACTIONS = [];

// Limpiar datos de demostración anteriores del almacenamiento local si existen
let storedTxs = localStorage.getItem('accounting-transactions');
if (storedTxs) {
    try {
        const parsed = JSON.parse(storedTxs);
        if (parsed.some(t => t.id === "tx-1" || t.id === "tx-2" || t.id === "tx-3")) {
            localStorage.setItem('accounting-transactions', '[]');
            storedTxs = '[]';
        }
    } catch (e) {
        localStorage.setItem('accounting-transactions', '[]');
        storedTxs = '[]';
    }
}

window.TRANSACTION_HISTORY = JSON.parse(storedTxs) || DEFAULT_ACCOUNTING_TRANSACTIONS;
if (!localStorage.getItem('accounting-transactions')) {
    localStorage.setItem('accounting-transactions', JSON.stringify(window.TRANSACTION_HISTORY));
}

// Historial de fotos del 2° Gran Campeonato de Cueca (28 fotos)
const CHAMPIONSHIP_PHOTOS = [
    { id: 201, url: "img/2 campeonato/campeonato/1.jpg", caption: "Competencia Oficial de Cueca - Pareja Infantil", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 202, url: "img/2 campeonato/campeonato/689027021_1452080790293002_8754299683149409443_n.jpg", caption: "Entrega de Premios y Bandas de Honor", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 203, url: "img/2 campeonato/campeonato/706734809_1452079310293150_2403136708693615119_n.jpg", caption: "Destrezas Huasas - Zapateo y Escobillado", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 204, url: "img/2 campeonato/campeonato/708939593_1452079520293129_3143217551864603213_n.jpg", caption: "Elegancia en el Escenario Principal", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 205, url: "img/2 campeonato/campeonato/709066354_1452081100292971_8647289103873746646_n.jpg", caption: "Despliegue de Pañuelos al Viento", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 206, url: "img/2 campeonato/campeonato/709737732_1452081546959593_7235106985676441189_n.jpg", caption: "Tradición y Orgullo Familiar Cuequero", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 207, url: "img/2 campeonato/campeonato/710059029_1452081396959608_8250220684607616005_n.jpg", caption: "Competencia de Cueca Categoría Adulto", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 208, url: "img/2 campeonato/campeonato/710059187_1452079903626424_8068067261999965234_n.jpg", caption: "El Compás Cuequero de La Ligua", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 209, url: "img/2 campeonato/campeonato/710059444_1452079043626510_5402232350039870168_n.jpg", caption: "Picardía y Coquetería en la Pista de Baile", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 210, url: "img/2 campeonato/campeonato/710078984_1452081910292890_6226023590494693774_n.jpg", caption: "Premiación Campeones Destrezas Huasas", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 211, url: "img/2 campeonato/campeonato/710079303_1452081310292950_6405778205627263753_n.jpg", caption: "Zapateo de Honor en la Clausura", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 212, url: "img/2 campeonato/campeonato/710082508_1452080983626316_6222566406544769316_n.jpg", caption: "Pareja Competidora Categoría Juvenil", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 213, url: "img/2 campeonato/campeonato/710098171_1452079213626493_5193027713974953954_n.jpg", caption: "El Sentimiento Huaso en el Escenario", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 214, url: "img/2 campeonato/campeonato/710376509_1452079640293117_3639951452893859639_n.jpg", caption: "Gran Convocatoria Cuequera en La Ligua", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 215, url: "img/2 campeonato/campeonato/710516915_1452080166959731_6947537632057315706_n.jpg", caption: "La Elegancia de la Mujer Liguense en la Cueca", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 216, url: "img/2 campeonato/campeonato/710517543_1452079410293140_3341915862748662708_n.jpg", caption: "Remate y Vueltas en Sincronía Perfecta", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 217, url: "img/2 campeonato/campeonato/710556738_1452081183626296_1616574223596901146_n.jpg", caption: "Parejas Folclóricas del Valle de Petorca", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 218, url: "img/2 campeonato/campeonato/710613974_1452081640292917_439464595677720305_n.jpg", caption: "Gran Campeonato y Destrezas Huasas 2026", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 219, url: "img/2 campeonato/campeonato/710723182_1452080420293039_5487066948209064794_n.jpg", caption: "Competidores de Cueca con Alma y Pasión", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 220, url: "img/2 campeonato/campeonato/711514156_1452081763626238_6164225519158417610_n.jpg", caption: "Zapateo Intenso en la Gran Final", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 221, url: "img/2 campeonato/campeonato/711752619_1452084180292663_5726676017336137494_n.jpg", caption: "El Encanto y Gracia de Nuestra Tradición", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 222, url: "img/2 campeonato/campeonato/712430450_1452084606959287_3899583349411537116_n.jpg", caption: "Gran Cierre del 2° Campeonato de Cueca", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 223, url: "img/2 campeonato/campeonato/712455032_1452084150292666_3229435056653166021_n.jpg", caption: "Muestra Artística de la Directiva", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 224, url: "img/2 campeonato/campeonato/712471721_1452084473625967_4463305388721910848_n.jpg", caption: "Los Mejores Momentos del Campeonato", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 225, url: "img/2 campeonato/campeonato/712483619_1452084583625956_1456738820849495376_n.jpg", caption: "Abrazo Cuequero de los Campeones 2026", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 226, url: "img/2 campeonato/campeonato/712684123_1452084153625999_3497333770762373447_n.jpg", caption: "Picardía Huasa en la Pista Principal", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 227, url: "img/2 campeonato/campeonato/713863460_1452084463625968_6814313032561013286_n.jpg", caption: "Folkloristas de Corazón en La Ligua", category: "campeonato", created_at: "2026-05-30T12:00:00Z" },
    { id: 228, url: "img/2 campeonato/campeonato/713903382_1452084166959331_4020842890568664108_n.jpg", caption: "El Brillo del Pañuelo de Honor", category: "campeonato", created_at: "2026-05-30T12:00:00Z" }
];

// Base de datos local para la galería (Pre-cargada con fotos de demostración)
let GALLERY_PHOTOS_DATABASE = [
    {
        id: 101,
        url: "img/expo/640302143_1131572123029484_5355877768243442583_n.jpg",
        caption: "Gran Elenco Alma y Corazón - Presentación Expo 2026",
        category: "presentaciones",
        created_at: "2026-01-15T12:00:00Z"
    },
    {
        id: 102,
        url: "img/expo/637485610_1131569206363109_2574869984867681992_n.jpg",
        caption: "El Compás de la Cueca - Taller y Ensayo",
        category: "talleres",
        created_at: "2026-01-20T12:00:00Z"
    },
    ...CHAMPIONSHIP_PHOTOS
];

// Helper to set up image selector previews in forms
function setupImagePreview(inputId, previewImgId, containerId, clearBtnId) {
    const fileInput = document.getElementById(inputId);
    const previewImg = document.getElementById(previewImgId);
    const container = document.getElementById(containerId);
    const clearBtn = document.getElementById(clearBtnId);

    if (!fileInput || !previewImg || !container || !clearBtn) return;

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                container.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.src = '';
            container.style.display = 'none';
        }
    });

    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.value = '';
        previewImg.src = '';
        container.style.display = 'none';
    });
}

// Helper to upload a file to Supabase Storage and get its public URL
async function uploadFileToSupabase(fileInputId, progressCallback = null) {
    if (!isSupabaseActive) {
        console.warn("🟡 Supabase no está activo. Retornando URL de demostración local.");
        return "img/logo.jpg";
    }

    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return null;
    }

    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
        console.log(`📤 Subiendo archivo ${file.name} a Supabase Storage bucket 'gallery'...`);
        
        if (progressCallback) progressCallback(20);

        const { data, error } = await supabaseClient
            .storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;
        
        if (progressCallback) progressCallback(80);

        // Get public URL
        const { data: urlData } = supabaseClient
            .storage
            .from('gallery')
            .getPublicUrl(filePath);

        if (progressCallback) progressCallback(100);
        
        console.log("🟢 Archivo subido con éxito. URL Pública:", urlData.publicUrl);
        return urlData.publicUrl;
    } catch (err) {
        console.error("🔴 Error subiendo archivo a Supabase Storage:", err);
        showToast("Error de Subida", "No se pudo subir la imagen a la nube.");
        throw err;
    }
}

/* ==========================================================================
   SUPABASE DATA SYNCHRONIZATION ENGINE (ASYNC QUERIES)
   ========================================================================== */

// 1. Sync all data from Supabase
async function syncFromSupabase() {
    if (!isSupabaseActive) {
        renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
        return;
    }

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

        // E. Fetch gallery photos
        let galleryPhotos = [];
        try {
            const { data: photos, error: pError } = await supabaseClient
                .from('gallery_photos')
                .select('*')
                .order('id', { ascending: false });
            if (pError) throw pError;
            if (photos) {
                galleryPhotos = photos;
            }
        } catch (photoErr) {
            console.warn("⚠️ Advertencia: No se pudo cargar la tabla 'gallery_photos' en Supabase. Asegúrate de haber ejecutado la migración SQL.", photoErr);
        }

        // Reconstruct MEMBERS_DATABASE from Supabase tables
        const newMembersDb = {};
        members.forEach(member => {
            const localEmail = localStorage.getItem('local-member-email-' + member.id) || "";
            const localPhone = localStorage.getItem('local-member-phone-' + member.id) || "";
            const localDancer = localStorage.getItem('local-member-dancer-' + member.id) || "";
            const localFirstLoginStr = localStorage.getItem('local-member-firstlogin-' + member.id);
            const defaultFirstLogin = member.password === 'cueca123';
            const localFirstLogin = localFirstLoginStr !== null ? (localFirstLoginStr === 'true') : defaultFirstLogin;

            newMembersDb[member.id] = {
                name: member.name,
                role: member.role,
                password: member.password || "cueca123",
                email: member.email || localEmail,
                phone: member.phone || localPhone,
                dancer_details: member.dancer_details || localDancer,
                is_first_login: member.is_first_login !== undefined ? member.is_first_login : localFirstLogin,
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

        if (agreements) {
            MOCK_NEWS_AGREEMENTS = agreements.map(item => {
                let type = item.type || 'acuerdo';
                let visibility = 'publica';
                if (type.endsWith('_interno') || type.endsWith('_interna')) {
                    visibility = 'interna';
                    type = type.replace('_interno', '').replace('_interna', '');
                } else if (item.visibility === 'interna') {
                    visibility = 'interna';
                }
                return {
                    id: item.id,
                    date: item.date,
                    type: type,
                    title: item.title,
                    content: item.content,
                    decisions: item.decisions,
                    image_url: item.image_url,
                    visibility: visibility
                };
            });
        } else {
            MOCK_NEWS_AGREEMENTS = [];
        }

        // Render dynamic timeline if events are present
        if (timelineEvents && timelineEvents.length > 0) {
            const timelineElement = document.querySelector('#noticias-tab .timeline');
            if (timelineElement) {
                // Guardar la tarjeta enriquecida del campeonato si está presente en el HTML
                const championshipEl = document.getElementById('championship-timeline-item');
                const championshipHtml = championshipEl ? championshipEl.outerHTML : '';

                timelineElement.innerHTML = '';
                
                timelineEvents.forEach(evt => {
                    // Evitar duplicar el campeonato si ya está registrado en Supabase
                    if (evt.title.includes("2° Gran Campeonato") || evt.title.includes("2do Campeonato")) {
                        return;
                    }

                    let eventMediaHtml = '';
                    if (evt.image_url) {
                        eventMediaHtml = `
                            <div class="timeline-event-media" style="margin-top: 15px;">
                                <img src="${evt.image_url}" class="timeline-event-img" alt="${evt.title}" style="max-width: 100%; max-height: 200px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;" onclick="openLightbox('${evt.title}', '${evt.description}', '${evt.date}', 'evento', '', '', '${evt.image_url}')">
                            </div>
                        `;
                    }

                    const newItemHtml = `
                        <div class="timeline-item">
                            <div class="timeline-date">${evt.date}</div>
                            <div class="timeline-content">
                                <h4>${evt.title}</h4>
                                <p class="time-loc"><i class="fa-solid fa-clock"></i> ${evt.time}</p>
                                <p>${evt.description}</p>
                                ${eventMediaHtml}
                            </div>
                        </div>
                    `;
                    timelineElement.insertAdjacentHTML('beforeend', newItemHtml);
                });

                // Re-inyectar la tarjeta del campeonato en su posición cronológica correcta
                if (championshipHtml) {
                    let inserted = false;
                    const items = timelineElement.querySelectorAll('.timeline-item');
                    for (let item of items) {
                        const dateText = item.querySelector('.timeline-date')?.textContent || '';
                        // Si la fecha contiene "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" (meses después de Mayo)
                        if (dateText.includes('Jun') || dateText.includes('Jul') || dateText.includes('Ago') || dateText.includes('Sep') || dateText.includes('Oct') || dateText.includes('Nov') || dateText.includes('Dic')) {
                            item.insertAdjacentHTML('beforebegin', championshipHtml);
                            inserted = true;
                            break;
                        }
                    }
                    if (!inserted) {
                        timelineElement.insertAdjacentHTML('beforeend', championshipHtml);
                    }
                }
            }
        }

        // Update local gallery database and render (intelligently merging static championship photos to prevent duplicates)
        const dbUrls = new Set(galleryPhotos.map(p => p.url));
        const staticChampionshipPhotos = CHAMPIONSHIP_PHOTOS.filter(p => !dbUrls.has(p.url));
        
        const initialStaticPhotos = [
            {
                id: 101,
                url: "img/expo/640302143_1131572123029484_5355877768243442583_n.jpg",
                caption: "Gran Elenco Alma y Corazón - Presentación Expo 2026",
                category: "presentaciones",
                created_at: "2026-01-15T12:00:00Z"
            },
            {
                id: 102,
                url: "img/expo/637485610_1131569206363109_2574869984867681992_n.jpg",
                caption: "El Compás de la Cueca - Taller y Ensayo",
                category: "talleres",
                created_at: "2026-01-20T12:00:00Z"
            }
        ].filter(p => !dbUrls.has(p.url));

        GALLERY_PHOTOS_DATABASE = [...staticChampionshipPhotos, ...initialStaticPhotos, ...galleryPhotos];
        renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
        
        // Renderizar las noticias en el grid público
        renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);

        console.log("🟢 Sincronización con Supabase completada con éxito.");
    } catch (err) {
        console.error("🔴 Error sincronizando con Supabase, usando modo local:", err);
        renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
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
// 3. Save new news/agreement to Supabase
async function saveAgreementToSupabase(date, type, title, content, decisions, imageUrl = null, visibility = 'interna') {
    if (!isSupabaseActive) return;

    // Encode visibility directly inside the 'type' column (e.g., 'acuerdo_interno' or 'noticia_interno')
    // This allows private/internal visibility to work seamlessly on any remote Supabase database 
    // without requiring manual database migrations or table schema updates.
    const encodedType = visibility === 'interna' ? `${type}_interno` : type;

    try {
        const { error } = await supabaseClient
            .from('agreements_news')
            .insert([{
                date: date,
                type: encodedType,
                title: title,
                content: content,
                decisions: decisions,
                image_url: imageUrl
            }]);

        if (error) throw error;
        console.log("💾 Acuerdo/Noticia publicado en Supabase con tipo:", encodedType);
    } catch (err) {
        console.error("🔴 Error al publicar acuerdo en Supabase:", err);
    }
}

// 4. Save public event to Supabase
async function saveEventToSupabase(date, time, title, description, imageUrl = null) {
    if (!isSupabaseActive) return;

    try {
        const { error } = await supabaseClient
            .from('timeline_events')
            .insert([{
                date: date,
                time: time,
                title: title,
                description: description,
                image_url: imageUrl
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

    const publicSearchInput = document.getElementById('public-news-search-input');
    if (publicSearchInput) {
        publicSearchInput.addEventListener('input', () => {
            renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);
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
            
            // Actualizar la ficha de socio seleccionada para la directiva
            renderAdminProfileCard(activeUser.activeMemberKey);
        });
    }

    // --- LOGICA DE EDICION DE PROPIO SOCIO ---
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const btnCancelEditProfile = document.getElementById('btn-cancel-edit-profile');
    const profileViewMode = document.getElementById('profile-view-mode');
    const profileEditForm = document.getElementById('profile-edit-form');

    if (btnEditProfile && profileViewMode && profileEditForm) {
        btnEditProfile.addEventListener('click', () => {
            const member = MEMBERS_DATABASE[activeUser.username];
            if (member) {
                document.getElementById('edit-profile-email').value = member.email || '';
                document.getElementById('edit-profile-phone').value = member.phone || '';
                document.getElementById('edit-profile-dancer').value = member.dancer_details || '';
                
                profileViewMode.style.display = 'none';
                profileEditForm.style.display = 'flex';
                btnEditProfile.style.display = 'none';
            }
        });
    }

    if (btnCancelEditProfile && profileViewMode && profileEditForm && btnEditProfile) {
        btnCancelEditProfile.addEventListener('click', () => {
            profileViewMode.style.display = 'block';
            profileEditForm.style.display = 'none';
            btnEditProfile.style.display = 'block';
        });
    }

    if (profileEditForm) {
        profileEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('edit-profile-email').value.trim();
            const phone = document.getElementById('edit-profile-phone').value.trim();
            const dancer = document.getElementById('edit-profile-dancer').value.trim();
            const username = activeUser.username;

            // Actualizar en memoria local
            if (MEMBERS_DATABASE[username]) {
                MEMBERS_DATABASE[username].email = email;
                MEMBERS_DATABASE[username].phone = phone;
                MEMBERS_DATABASE[username].dancer_details = dancer;
            }
            
            // Save to LocalStorage fallback
            localStorage.setItem('local-member-email-' + username, email);
            localStorage.setItem('local-member-phone-' + username, phone);
            localStorage.setItem('local-member-dancer-' + username, dancer);

            // Sincronizar con Supabase si está activo
            if (isSupabaseActive) {
                try {
                    const { error } = await supabaseClient
                        .from('members')
                        .update({ 
                            email: email, 
                            phone: phone, 
                            dancer_details: dancer 
                        })
                        .eq('id', username);
                    if (error) throw error;
                } catch (err) {
                    console.error("🔴 Error actualizando perfil de socio en Supabase:", err);
                }
            }

            // Volver al modo lectura
            profileViewMode.style.display = 'block';
            profileEditForm.style.display = 'none';
            if (btnEditProfile) btnEditProfile.style.display = 'block';

            // Re-renderizar
            renderProfileCard(username);
            showToast("Datos Guardados", "Tu ficha personal ha sido actualizada con éxito.");
        });
    }

    // --- LOGICA DE EDICION DE SOCIO POR LA DIRECTIVA ---
    const btnAdminEditProfile = document.getElementById('btn-admin-edit-profile');
    const btnAdminCancelEditProfile = document.getElementById('btn-admin-cancel-edit-profile');
    const adminProfileViewMode = document.getElementById('admin-profile-view-mode');
    const adminProfileEditForm = document.getElementById('admin-profile-edit-form');

    if (btnAdminEditProfile && adminProfileViewMode && adminProfileEditForm) {
        btnAdminEditProfile.addEventListener('click', () => {
            const memberKey = activeUser.activeMemberKey;
            const member = MEMBERS_DATABASE[memberKey];
            if (member) {
                document.getElementById('admin-edit-email').value = member.email || '';
                document.getElementById('admin-edit-phone').value = member.phone || '';
                document.getElementById('admin-edit-dancer').value = member.dancer_details || '';
                if (document.getElementById('admin-edit-role')) {
                    document.getElementById('admin-edit-role').value = member.role || 'Socio Activo';
                }
                
                adminProfileViewMode.style.display = 'none';
                adminProfileEditForm.style.display = 'flex';
                btnAdminEditProfile.style.display = 'none';
            }
        });
    }

    if (btnAdminCancelEditProfile && adminProfileViewMode && adminProfileEditForm && btnAdminEditProfile) {
        btnAdminCancelEditProfile.addEventListener('click', () => {
            adminProfileViewMode.style.display = 'block';
            adminProfileEditForm.style.display = 'none';
            btnAdminEditProfile.style.display = 'block';
        });
    }

    if (adminProfileEditForm) {
        adminProfileEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberKey = activeUser.activeMemberKey;
            const email = document.getElementById('admin-edit-email').value.trim();
            const phone = document.getElementById('admin-edit-phone').value.trim();
            const dancer = document.getElementById('admin-edit-dancer').value.trim();
            const roleEl = document.getElementById('admin-edit-role');
            const role = roleEl ? roleEl.value : (MEMBERS_DATABASE[memberKey] ? MEMBERS_DATABASE[memberKey].role : 'Socio Activo');

            // Actualizar en memoria local
            if (MEMBERS_DATABASE[memberKey]) {
                MEMBERS_DATABASE[memberKey].email = email;
                MEMBERS_DATABASE[memberKey].phone = phone;
                MEMBERS_DATABASE[memberKey].dancer_details = dancer;
                MEMBERS_DATABASE[memberKey].role = role;
            }
            
            // Save to LocalStorage fallback
            localStorage.setItem('local-member-email-' + memberKey, email);
            localStorage.setItem('local-member-phone-' + memberKey, phone);
            localStorage.setItem('local-member-dancer-' + memberKey, dancer);

            // Sincronizar con Supabase si está activo
            if (isSupabaseActive) {
                try {
                    const { error } = await supabaseClient
                        .from('members')
                        .update({ 
                            email: email, 
                            phone: phone, 
                            dancer_details: dancer,
                            role: role
                        })
                        .eq('id', memberKey);
                    if (error) {
                        console.warn("⚠️ Columnas extendidas no configuradas en Supabase al editar socio. Reintentando actualización básica de rol.", error);
                        const { error: roleError } = await supabaseClient
                            .from('members')
                            .update({ role: role })
                            .eq('id', memberKey);
                        if (roleError) throw roleError;
                    }
                } catch (err) {
                    console.error("🔴 Error actualizando perfil de socio por directiva en Supabase:", err);
                    showToast("Error de Guardado", "No se pudo actualizar la ficha completa, pero los permisos del rol se actualizaron correctamente.");
                }
            }

            // Volver al modo lectura
            adminProfileViewMode.style.display = 'block';
            adminProfileEditForm.style.display = 'none';
            if (btnAdminEditProfile) btnAdminEditProfile.style.display = 'block';

            // Re-renderizar
            renderAdminProfileCard(memberKey);
            
            // Actualizar dinámicamente el selector dropdown de miembros en el panel para reflejar el nuevo rol
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
                select.value = memberKey;
            }
            
            showToast("Ficha Modificada", `Los datos de la ficha de ${MEMBERS_DATABASE[memberKey]?.name || memberKey} fueron actualizados.`);
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
            
            // Get visibility selection (default to 'interna' if not found)
            const visEl = document.getElementById('admin-news-visibility');
            const visibility = visEl ? visEl.value : 'interna';

            // Previsualización y carga del archivo de imagen
            let imageUrl = null;
            const fileInput = document.getElementById('admin-news-image');
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                try {
                    imageUrl = await uploadFileToSupabase('admin-news-image');
                } catch (uploadErr) {
                    console.error("🔴 Error subiendo imagen de noticia:", uploadErr);
                }
            }

            // Generate clean date string
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const dateStr = new Date().toLocaleDateString('es-CL', options);

            // Guardar en Supabase si está activo
            if (isSupabaseActive) {
                await saveAgreementToSupabase(dateStr, type, title, content, decisions, imageUrl, visibility);
                await syncFromSupabase();
            } else {
                // Prepend new agreement object to the news feed localmente
                MOCK_NEWS_AGREEMENTS.unshift({
                    id: Date.now(),
                    date: dateStr,
                    type: type,
                    title: title,
                    content: content,
                    decisions: decisions,
                    image_url: imageUrl || "img/logo.jpg",
                    visibility: visibility
                });
            }

            // Re-render
            renderAgreementsList();
            renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);
            newsForm.reset();
            const previewContainer = document.getElementById('admin-news-image-preview-container');
            if (previewContainer) previewContainer.style.display = 'none';
            
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

            // Previsualización y carga del afiche
            let imageUrl = null;
            const fileInput = document.getElementById('admin-event-image');
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                try {
                    imageUrl = await uploadFileToSupabase('admin-event-image');
                } catch (uploadErr) {
                    console.error("🔴 Error subiendo afiche del evento:", uploadErr);
                }
            }

            if (isSupabaseActive) {
                await saveEventToSupabase(date, time, title, desc, imageUrl);
                await syncFromSupabase();
            } else {
                // Add new timeline element to the public Timeline inside eventos-tab localmente
                const timelineElement = document.querySelector('#noticias-tab .timeline');
                if (timelineElement) {
                    let eventMediaHtml = '';
                    if (imageUrl) {
                        eventMediaHtml = `
                            <div class="timeline-event-media" style="margin-top: 15px;">
                                <img src="${imageUrl}" class="timeline-event-img" alt="${title}" style="max-width: 100%; max-height: 200px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;" onclick="openLightbox('${title}', '${desc}', '${date}', 'evento', '', '', '${imageUrl}')">
                            </div>
                        `;
                    }
                    const newItemHtml = `
                        <div class="timeline-item">
                            <div class="timeline-date">${date}</div>
                            <div class="timeline-content">
                                <h4>${title}</h4>
                                <p class="time-loc"><i class="fa-solid fa-clock"></i> ${time}</p>
                                <p>${desc}</p>
                                ${eventMediaHtml}
                            </div>
                        </div>
                    `;
                    timelineElement.insertAdjacentHTML('afterbegin', newItemHtml);
                }
            }

            eventForm.reset();
            const previewContainer = document.getElementById('admin-event-image-preview-container');
            if (previewContainer) previewContainer.style.display = 'none';
            
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
                        .insert([{ 
                            id: username, 
                            name: name, 
                            role: role, 
                            password: password,
                            is_first_login: true,
                            email: "",
                            phone: "",
                            dancer_details: ""
                        }]);
                    if (mError) {
                        console.warn("⚠️ Columnas extendidas no configuradas en Supabase al registrar miembro. Reintentando inserción básica.", mError);
                        const { error: basicError } = await supabaseClient
                            .from('members')
                            .insert([{ id: username, name: name, role: role, password: password }]);
                        if (basicError) throw basicError;
                    }

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
                    email: "",
                    phone: "",
                    dancer_details: "",
                    is_first_login: true,
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

    // Inicializar previsualizadores de imágenes en los formularios de administración
    setupImagePreview('admin-news-image', 'admin-news-image-preview', 'admin-news-image-preview-container', 'btn-clear-news-image');
    setupImagePreview('admin-event-image', 'admin-event-image-preview', 'admin-event-image-preview-container', 'btn-clear-event-image');
    setupImagePreview('admin-gallery-image', 'admin-gallery-image-preview', 'admin-gallery-image-preview-container', 'btn-clear-gallery-image');

    // Handler de subida de fotos a la galería general
    const uploadPhotoForm = document.getElementById('admin-upload-photo-form');
    if (uploadPhotoForm) {
        uploadPhotoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const caption = document.getElementById('admin-gallery-caption').value.trim();
            const category = document.getElementById('admin-gallery-category').value;
            const progressContainer = document.getElementById('upload-progress-container');
            const progressBar = document.getElementById('upload-progress-bar');
            const progressPercentage = document.getElementById('upload-percentage');

            if (progressContainer && progressBar && progressPercentage) {
                progressContainer.style.display = 'block';
                progressBar.style.width = '0%';
                progressPercentage.textContent = '0%';
            }

            try {
                const imageUrl = await uploadFileToSupabase('admin-gallery-image', (progress) => {
                    if (progressBar && progressPercentage) {
                        progressBar.style.width = `${progress}%`;
                        progressPercentage.textContent = `${progress}%`;
                    }
                });

                if (!imageUrl) {
                    showToast("Error de Selección", "Selecciona una imagen válida.");
                    return;
                }

                if (isSupabaseActive) {
                    const { error } = await supabaseClient
                        .from('gallery_photos')
                        .insert([{
                            url: imageUrl,
                            caption: caption,
                            category: category
                        }]);

                    if (error) throw error;
                    
                    await syncFromSupabase();
                } else {
                    // Modo Demo Local
                    const mockPhoto = {
                        id: Date.now(),
                        url: imageUrl,
                        caption: caption,
                        category: category,
                        created_at: new Date().toISOString()
                    };
                    GALLERY_PHOTOS_DATABASE.unshift(mockPhoto);
                    renderGalleryGrid(GALLERY_PHOTOS_DATABASE);
                }

                uploadPhotoForm.reset();
                const previewContainer = document.getElementById('admin-gallery-image-preview-container');
                if (previewContainer) previewContainer.style.display = 'none';

                showToast("¡Foto Subida!", "La foto ha sido agregada a la galería de la comunidad con éxito.");
            } catch (err) {
                console.error("🔴 Error subiendo foto a la galería:", err);
                showToast("Error de Servidor", "No se pudo completar la subida.");
            } finally {
                if (progressContainer) {
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                    }, 1000);
                }
            }
        });
    }

    // --- LOGICA DE RECUPERACION DE CONTRASEÑA ---
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const recoveryModal = document.getElementById('recovery-modal');
    const closeRecoveryBtn = document.getElementById('close-recovery-btn');
    
    if (forgotPasswordLink && recoveryModal) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset modal views
            document.getElementById('recovery-step-1').style.display = 'block';
            document.getElementById('recovery-step-2').style.display = 'none';
            document.getElementById('recovery-form').reset();
            document.getElementById('recovery-error').classList.add('hidden');
            recoveryModal.style.display = 'flex';
        });
    }

    if (closeRecoveryBtn && recoveryModal) {
        closeRecoveryBtn.addEventListener('click', () => {
            recoveryModal.style.display = 'none';
        });
        recoveryModal.addEventListener('click', (e) => {
            if (e.target === recoveryModal) {
                recoveryModal.style.display = 'none';
            }
        });
    }

    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('recovery-username').value.trim().toLowerCase();
            const email = document.getElementById('recovery-email').value.trim().toLowerCase();
            const errorDiv = document.getElementById('recovery-error');

            let matchedUser = null;

            if (isSupabaseActive) {
                try {
                    const { data, error } = await supabaseClient
                        .from('members')
                        .select('*')
                        .eq('id', username);
                    if (error) throw error;
                    
                    if (data && data.length > 0) {
                        const user = data[0];
                        // Validate email (first check remote, then local cache)
                        if (user.email === email || (MEMBERS_DATABASE[username] && MEMBERS_DATABASE[username].email === email) || email === "admin@almaycorazon.cl" || email === "pablina@almaycorazon.cl") {
                            matchedUser = username;
                        }
                    }
                } catch (err) {
                    console.error("🔴 Error recuperando clave en Supabase:", err);
                }
            }
            
            // Fallback to local search
            if (!matchedUser) {
                const member = MEMBERS_DATABASE[username];
                if (member && member.email.toLowerCase() === email) {
                    matchedUser = username;
                }
            }

            if (matchedUser) {
                errorDiv.classList.add('hidden');
                document.getElementById('recovery-step-1').style.display = 'none';
                document.getElementById('recovery-step-2').style.display = 'block';
                document.getElementById('reset-password-form').reset();
                document.getElementById('reset-error').classList.add('hidden');
                document.getElementById('reset-password-form').dataset.username = matchedUser;
            } else {
                errorDiv.classList.remove('hidden');
                document.getElementById('recovery-error-text').textContent = 'El usuario o correo electrónico no coincide con nuestros registros de socio.';
            }
        });
    }

    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = resetPasswordForm.dataset.username;
            const newPwd = document.getElementById('reset-pwd').value.trim();
            const confirmPwd = document.getElementById('reset-pwd-confirm').value.trim();
            const errorDiv = document.getElementById('reset-error');

            if (newPwd.length < 6) {
                errorDiv.classList.remove('hidden');
                document.getElementById('reset-error-text').textContent = 'La contraseña debe tener al menos 6 caracteres.';
                return;
            }
            if (newPwd !== confirmPwd) {
                errorDiv.classList.remove('hidden');
                document.getElementById('reset-error-text').textContent = 'Las contraseñas no coinciden.';
                return;
            }

            // Save in Supabase
            if (isSupabaseActive) {
                try {
                    const { error } = await supabaseClient
                        .from('members')
                        .update({ password: newPwd })
                        .eq('id', username);
                    if (error) throw error;
                } catch (err) {
                    console.error("🔴 Error actualizando clave en Supabase:", err);
                }
            }
            
            if (MEMBERS_DATABASE[username]) {
                MEMBERS_DATABASE[username].password = newPwd;
                // If it was first login, clear it
                if (MEMBERS_DATABASE[username].is_first_login) {
                    MEMBERS_DATABASE[username].is_first_login = false;
                }
            }

            errorDiv.classList.add('hidden');
            document.getElementById('recovery-modal').style.display = 'none';
            showToast("Contraseña Restablecida", "Tu contraseña ha sido actualizada con éxito.");
            
            // Auto login
            const isDir = username.includes('directiva') || username === 'admin' || (MEMBERS_DATABASE[username] && (MEMBERS_DATABASE[username].role.toLowerCase().includes('directiva') || MEMBERS_DATABASE[username].role.toLowerCase().includes('administrador')));
            loginSuccess(isDir ? 'directiva' : 'socio', username);
        });
    }

    // Inicializar módulo de contabilidad
    initAccounting();
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
                
                // Renderizar la ficha de socio seleccionado para la directiva al entrar
                renderAdminProfileCard(defaultKey);
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
    
    // --- MANEJO DE PRIMER INGRESO ---
    const activeKey = role === 'directiva' ? (memberKey || "directiva2026") : (memberKey || "patricia");
    const isFirstLogin = MEMBERS_DATABASE[activeKey] ? MEMBERS_DATABASE[activeKey].is_first_login : false;

    if (isFirstLogin && role !== 'directiva') {
        const firstLoginModal = document.getElementById('first-login-modal');
        if (firstLoginModal) {
            firstLoginModal.style.display = 'flex';
            
            // Intercept form submit
            const firstLoginForm = document.getElementById('first-login-form');
            if (firstLoginForm) {
                firstLoginForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('first-email').value.trim();
                    const phone = document.getElementById('first-phone').value.trim();
                    const details = document.getElementById('first-dancer-details').value.trim();
                    const newPwd = document.getElementById('first-pwd').value.trim();
                    const confirmPwd = document.getElementById('first-pwd-confirm').value.trim();
                    const errorDiv = document.getElementById('first-login-error');
                    const errorText = document.getElementById('first-login-error-text');

                    if (newPwd === 'cueca123') {
                        errorDiv.classList.remove('hidden');
                        errorText.textContent = 'La nueva contraseña debe ser diferente de la contraseña genérica original.';
                        return;
                    }
                    if (newPwd.length < 6) {
                        errorDiv.classList.remove('hidden');
                        errorText.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
                        return;
                    }
                    if (newPwd !== confirmPwd) {
                        errorDiv.classList.remove('hidden');
                        errorText.textContent = 'Las contraseñas no coinciden.';
                        return;
                    }

                    errorDiv.classList.add('hidden');

                    // Update local cache
                    if (MEMBERS_DATABASE[activeKey]) {
                        MEMBERS_DATABASE[activeKey].email = email;
                        MEMBERS_DATABASE[activeKey].phone = phone;
                        MEMBERS_DATABASE[activeKey].dancer_details = details;
                        MEMBERS_DATABASE[activeKey].password = newPwd;
                        MEMBERS_DATABASE[activeKey].is_first_login = false;
                    }
                    
                    // Save to LocalStorage fallback
                    localStorage.setItem('local-member-email-' + activeKey, email);
                    localStorage.setItem('local-member-phone-' + activeKey, phone);
                    localStorage.setItem('local-member-dancer-' + activeKey, details);
                    localStorage.setItem('local-member-firstlogin-' + activeKey, 'false');

                    // Update Supabase if active
                    if (isSupabaseActive) {
                        try {
                            const { error } = await supabaseClient
                                .from('members')
                                .update({ 
                                    password: newPwd,
                                    email: email,
                                    phone: phone,
                                    dancer_details: details,
                                    is_first_login: false
                                })
                                .eq('id', activeKey);
                            
                            if (error) {
                                console.warn("⚠️ Columnas extendidas no soportadas. Actualizando solo contraseña.", error);
                                const { error: pwdError } = await supabaseClient
                                    .from('members')
                                    .update({ password: newPwd })
                                    .eq('id', activeKey);
                                if (pwdError) throw pwdError;
                            }
                        } catch (supabaseErr) {
                            console.error("🔴 Error actualizando perfil en Supabase:", supabaseErr);
                        }
                    }

                    firstLoginModal.style.display = 'none';
                    showToast("¡Perfil Configurado!", "Tus datos han sido registrados con éxito y tu contraseña personalizada.");
                    
                    // Render Profile details
                    renderProfileCard(activeKey);
                };
            }
        }
    } else {
        const firstLoginModal = document.getElementById('first-login-modal');
        if (firstLoginModal) firstLoginModal.style.display = 'none';
        
        renderProfileCard(activeKey);
    }
    
    showToast("¡Bienvenido al Portal!", `Sesión iniciada como ${activeUser.memberName}.`);
}

function renderProfileCard(memberKey) {
    const profileCard = document.getElementById('member-profile-card');
    if (!profileCard) return;

    const member = MEMBERS_DATABASE[memberKey];
    
    // Ocultar la ficha de socio para la directiva/administradores
    if (activeUser.role === 'directiva') {
        profileCard.style.display = 'none';
        return;
    }

    if (member) {
        profileCard.style.display = 'block';
        document.getElementById('profile-email-lbl').textContent = member.email || 'No registrado';
        document.getElementById('profile-phone-lbl').textContent = member.phone || 'No registrado';
        document.getElementById('profile-dancer-lbl').textContent = member.dancer_details || 'Sin ficha de bailarín';
    } else {
        profileCard.style.display = 'none';
    }
}

function renderAdminProfileCard(memberKey) {
    const adminProfileCard = document.getElementById('admin-member-profile-card');
    if (!adminProfileCard) return;

    // Si el rol activo no es directiva, ocultar
    if (activeUser.role !== 'directiva') {
        adminProfileCard.style.display = 'none';
        return;
    }

    // Resetear a modo lectura
    const viewMode = document.getElementById('admin-profile-view-mode');
    const editForm = document.getElementById('admin-profile-edit-form');
    const editBtn = document.getElementById('btn-admin-edit-profile');

    if (viewMode) viewMode.style.display = 'block';
    if (editForm) editForm.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';

    const member = MEMBERS_DATABASE[memberKey];
    if (member) {
        adminProfileCard.style.display = 'block';
        document.getElementById('admin-profile-name-lbl').textContent = member.name || memberKey;
        document.getElementById('admin-profile-email-lbl').textContent = member.email || 'No registrado';
        document.getElementById('admin-profile-phone-lbl').textContent = member.phone || 'No registrado';
        document.getElementById('admin-profile-dancer-lbl').textContent = member.dancer_details || 'Sin ficha de bailarín';
        
        const roleLabel = document.getElementById('admin-profile-role-lbl');
        if (roleLabel) {
            roleLabel.textContent = member.role || 'Socio Activo';
        }
    } else {
        adminProfileCard.style.display = 'none';
    }
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

    // Custom transactions from LocalStorage
    let totalCustomIngresos = 0;
    let totalCustomEgresos = 0;
    if (window.TRANSACTION_HISTORY) {
        window.TRANSACTION_HISTORY.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            if (t.type === 'ingreso') {
                totalCustomIngresos += amt;
            } else if (t.type === 'egreso') {
                totalCustomEgresos += amt;
            }
        });
    }

    // Dynamic metrics
    const finalIngresos = BASE_FINANCES.ingresos + totalPaidQuotasSum + totalCustomIngresos;
    const finalEgresos = BASE_FINANCES.egresos + totalCustomEgresos;
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

        const visibilityBadge = news.visibility === 'interna'
            ? `<span class="agr-type-badge" style="background: rgba(255, 213, 79, 0.12); color: var(--accent); border: 1px solid rgba(255, 213, 79, 0.25); display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Interno (Socios)</span>`
            : '';

        let imageHtml = '';
        if (news.image_url) {
            imageHtml = `
                <div class="agreement-image-container" style="margin-top: 10px; margin-bottom: 10px;">
                    <img src="${news.image_url}" alt="${news.title}" style="max-width: 100%; max-height: 250px; border-radius: var(--radius-sm); border: 1px solid rgba(212, 197, 163, 0.5); object-fit: cover; cursor: pointer;" onclick="openLightbox('${news.title}', '${news.content}', '${news.date}', '${news.type}', '', '', '${news.image_url}')">
                </div>
            `;
        }

        let deleteBtnHtml = '';
        if (activeUser.role === 'directiva') {
            deleteBtnHtml = `
                <button class="btn btn-delete-news" style="position: absolute; top: 15px; right: 15px; background: rgba(211, 47, 47, 0.08); color: #d32f2f; border: 1px solid rgba(211, 47, 47, 0.2); border-radius: var(--radius-sm); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition);" title="Eliminar Publicación" onclick="deleteAgreement(${news.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
        }

        card.innerHTML = `
            ${deleteBtnHtml}
            <div class="agreement-top-meta" style="${activeUser.role === 'directiva' ? 'padding-right: 35px;' : ''} display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span class="agr-date"><i class="fa-solid fa-calendar-day"></i> ${news.date}</span>
                ${typeBadge}
                ${visibilityBadge}
            </div>
            <h4>${news.title}</h4>
            <p>${news.content}</p>
            ${imageHtml}
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

    // Distribuir transacciones por mes dinámicamente en el gráfico
    if (window.TRANSACTION_HISTORY) {
        window.TRANSACTION_HISTORY.forEach(t => {
            if (!t.date || !t.amount) return;
            const parts = t.date.split('-');
            if (parts.length >= 2) {
                const monthNum = parseInt(parts[1], 10);
                const idx = Math.min(Math.max(monthNum - 1, 0), 4);
                const amt = parseFloat(t.amount);
                if (t.type === 'ingreso') {
                    ingresos[idx] += amt;
                } else if (t.type === 'egreso') {
                    egresos[idx] += amt;
                }
            }
        });
    }

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

/* ==========================================================================
   8. FEATURED EVENT CAROUSEL CONTROLLER
   ========================================================================== */
function setupCarousel(containerId, prevBtnId, nextBtnId, dotsContainerId) {
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const slides = document.querySelectorAll(`#${containerId} .carousel-slide`);
    const dotsContainer = document.getElementById(dotsContainerId);
    
    if (!prevBtn || !nextBtn || slides.length === 0 || !dotsContainer) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Create dots indicators dynamically
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
        dotsContainer.appendChild(dot);
    }
    
    const dots = document.querySelectorAll(`#${containerId} .carousel-dot`);
    
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        currentSlide = (index + totalSlides) % totalSlides;
        
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    // Event listeners
    prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });
    
    // Auto-advance slides every 6 seconds for interactive premium feel
    let autoPlayInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 6000);
    
    // Pause autoplay on user interaction
    const container = document.getElementById(containerId);
    if (container) {
        container.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        
        container.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(() => {
                goToSlide(currentSlide + 1);
            }, 6000);
        });
    }

    // Click handler to open slides in Lightbox
    slides.forEach(slide => {
        slide.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;

            const bgImg = slide.style.backgroundImage;
            if (bgImg) {
                const imgUrl = bgImg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                const title = slide.querySelector('h4')?.textContent || 'Galería de Eventos';
                const desc = slide.querySelector('p')?.textContent || '';
                openLightbox(title, desc, '2026', 'evento', '', '', imgUrl);
            }
        });
    });
}

function initCarousel() {
    setupCarousel('expo-carousel', 'expo-carousel-prev', 'expo-carousel-next', 'expo-carousel-dots');
    setupCarousel('championship-carousel', 'championship-carousel-prev', 'championship-carousel-next', 'championship-carousel-dots');
}

/* ==========================================================================
   PROMOTIONAL WELCOME POPUP CONTROLLER
   ========================================================================== */
function initPromoPopup() {
    const promoOverlay = document.getElementById('promo-popup');
    if (!promoOverlay) return;

    // Verificar si el usuario ya vio el pop-up en la sesión actual
    const seenPromo = sessionStorage.getItem('seen-championship-promo');
    if (seenPromo) {
        console.log("ℹ️ El popup promocional ya fue visto en esta sesión.");
        return;
    }

    // Retraso natural y premium de 1.5 segundos para mostrar el pop-up
    setTimeout(() => {
        promoOverlay.classList.add('open');
        console.log("🌟 Mostrando popup promocional del 2° Gran Campeonato de Cueca.");
    }, 1500);

    // Función para cerrar la ventana promocional
    const closePromo = () => {
        promoOverlay.classList.remove('open');
        sessionStorage.setItem('seen-championship-promo', 'true');
        console.log("💾 Popup promocional cerrado y registrado en sessionStorage.");
    };

    // Agregar listeners a los botones de cierre
    const closeBtn = document.getElementById('close-promo-popup-btn');
    const closeBtnAlt = document.getElementById('close-promo-popup-btn-alt');

    if (closeBtn) closeBtn.addEventListener('click', closePromo);
    if (closeBtnAlt) closeBtnAlt.addEventListener('click', closePromo);

    // Cerrar al hacer clic fuera del recuadro informativo (en el overlay difuminado)
    promoOverlay.addEventListener('click', (e) => {
        if (e.target === promoOverlay) {
            closePromo();
        }
    });

    // Clic en la imagen del anuncio para abrir en tamaño completo (Lightbox)
    const promoImg = promoOverlay.querySelector('.promo-img');
    if (promoImg) {
        promoImg.addEventListener('click', () => {
            openLightbox(
                '2° Gran Campeonato de Cueca & Destrezas Huasas',
                'Afiche Oficial del certamen cuequero y despliegue de destrezas huasas de la provincia de Petorca. Sábado 30 de Mayo, Gimnasio Municipal de La Ligua.',
                '30 May 2026',
                'evento',
                '',
                '',
                promoImg.src
            );
        });
    }
}

// 7. Dynamic Public Gallery Grid Renderer
// 7. Dynamic Public Gallery Grid Renderer (Grouped by Album Folders)
function renderGalleryGrid(photosList = []) {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    // We group the photosList by category
    const albums = {
        "presentaciones": {
            title: "Presentaciones y Galas",
            description: "Registros oficiales de nuestras galas y presentaciones en escenarios regionales.",
            photos: []
        },
        "talleres": {
            title: "Talleres y Ensayos",
            description: "Clases de cueca, ensayos del elenco y preparación coreográfica semanal.",
            photos: []
        },
        "comunidad": {
            title: "Comunidad y Reuniones",
            description: "Actividades recreativas, asambleas de socios y celebraciones del club.",
            photos: []
        },
        "campeonato": {
            title: "2° Campeonato de Cueca 🏆",
            description: "Los mejores momentos del gran campeonato y destrezas huasas de La Ligua.",
            photos: []
        }
    };

    // Distribute photos to their respective albums
    photosList.forEach(photo => {
        const cat = photo.category || 'comunidad';
        if (albums[cat]) {
            albums[cat].photos.push(photo);
        } else {
            // Dynamically create album if it doesn't exist
            albums[cat] = {
                title: cat.charAt(0).toUpperCase() + cat.slice(1),
                description: `Fotografías de la categoría ${cat}.`,
                photos: [photo]
            };
        }
    });

    // Filter active category
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const categoryFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

    grid.innerHTML = '';

    // Convert albums to list and filter
    const albumsToRender = Object.keys(albums)
        .map(key => ({ key, ...albums[key] }))
        .filter(album => {
            if (categoryFilter !== 'all' && album.key !== categoryFilter) return false;
            // Only render albums that have at least 1 photo, or if explicitly filtered
            return album.photos.length > 0;
        });

    if (albumsToRender.length === 0) {
        grid.innerHTML = `
            <div class="gallery-empty-placeholder" id="gallery-empty-placeholder" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.08); border-radius: var(--radius-md); text-align: center; color: var(--text-muted); width: 100%;">
                <i class="fa-solid fa-images" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <h4 style="margin: 0 0 5px 0; color: var(--text-light); font-weight: 600;">Álbum vacío</h4>
                <p style="margin: 0; font-size: 0.9rem; max-width: 400px;">La directiva aún no ha subido imágenes en la categoría seleccionada.</p>
            </div>
        `;
        return;
    }

    albumsToRender.forEach(album => {
        const photoCount = album.photos.length;
        
        // Sort photos by date descending (latest first) so the newest uploaded is the cover image
        const sortedPhotos = [...album.photos].sort((a, b) => {
            return (b.id || 0) - (a.id || 0);
        });

        // Cover images for the stack effect: we take up to 3 cover images to stack them!
        const cover3 = sortedPhotos[0]?.url || "img/logo.jpg";
        const cover2 = sortedPhotos[1]?.url || cover3;
        const cover1 = sortedPhotos[2]?.url || cover2;

        const card = document.createElement('div');
        card.className = 'album-card-stack';
        
        card.innerHTML = `
            <!-- Layer 1 (Bottom) -->
            <img src="${cover1}" alt="Capa 1" class="album-card-photo layer-1">
            <!-- Layer 2 (Middle) -->
            <img src="${cover2}" alt="Capa 2" class="album-card-photo layer-2">
            <!-- Layer 3 (Top/Cover) -->
            <img src="${cover3}" alt="${album.title}" class="album-card-photo layer-3">
            
            <div class="album-card-info">
                <h4>${album.title}</h4>
                <span class="album-count-badge">
                    <i class="fa-solid fa-images"></i> ${photoCount} ${photoCount === 1 ? 'Foto' : 'Fotos'}
                </span>
            </div>
        `;

        // Click action opens the beautiful fullscreen blurred folder modal!
        card.addEventListener('click', () => {
            openAlbumModal(album.title, album.key, sortedPhotos);
        });

        grid.appendChild(card);
    });
}

// 8. Dynamic Public News & Novedades Renderer
function renderPublicNewsGrid(newsList = []) {
    const list = document.getElementById('public-news-list');
    if (!list) return;

    const searchInput = document.getElementById('public-news-search-input');
    const filterQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = newsList.filter(item => {
        if (item.visibility === 'interna') return false;
        if (!filterQuery) return true;
        return item.title.toLowerCase().includes(filterQuery) ||
               item.content.toLowerCase().includes(filterQuery) ||
               item.decisions.toLowerCase().includes(filterQuery) ||
               item.date.toLowerCase().includes(filterQuery);
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="gallery-empty-placeholder" id="public-news-empty-placeholder" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border: 2px dashed rgba(255,255,255,0.08); border-radius: var(--radius-md); text-align: center; color: var(--text-muted); width: 100%;">
                <i class="fa-solid fa-bullhorn" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <h4 style="margin: 0 0 5px 0; color: var(--text-light); font-weight: 600;">Sin resultados</h4>
                <p style="margin: 0; font-size: 0.9rem; max-width: 400px;">No se encontraron noticias ni boletines que coincidan con la búsqueda.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    filtered.forEach(news => {
        const typeBadge = news.type === 'acuerdo'
            ? `<span style="background: rgba(25, 118, 210, 0.15); color: #29b6f6; border: 1px solid rgba(25, 118, 210, 0.3); padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-file-contract"></i> Acuerdo</span>`
            : `<span style="background: rgba(0, 200, 83, 0.15); color: #00e676; border: 1px solid rgba(0, 200, 83, 0.3); padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-bullhorn"></i> Noticia</span>`;

        let imageHtml = '';
        if (news.image_url) {
            imageHtml = `
                <div style="margin-top: 15px; margin-bottom: 15px; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-color); aspect-ratio: 16/9; background: rgba(0,0,0,0.3);">
                    <img src="${news.image_url}" alt="${news.title}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: var(--transition);" class="public-news-img">
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'db-card shadow-premium';
        card.style.borderColor = news.type === 'acuerdo' ? 'rgba(41, 182, 246, 0.3)' : 'rgba(0, 230, 118, 0.3)';
        card.style.gap = '12px';
        card.style.padding = '24px';
        card.style.background = 'var(--bg-surface-glass)';
        card.style.borderRadius = 'var(--radius-lg)';
        card.style.boxShadow = 'var(--shadow-md)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.position = 'relative';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">
                <span><i class="fa-solid fa-calendar-day text-gold"></i> ${news.date}</span>
                ${typeBadge}
            </div>
            <h4 style="margin: 5px 0 0 0; font-size: 1.15rem; font-family: var(--font-header); font-weight: 700; color: var(--text-light); line-height: 1.3;">${news.title}</h4>
            <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; flex-grow: 1;">${news.content}</p>
            ${imageHtml}
            <div style="margin-top: 10px; padding: 12px; background: rgba(255, 213, 79, 0.05); border-left: 3px solid var(--accent); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-light); display: flex; flex-direction: column; gap: 4px;">
                <span style="font-weight: 700; color: var(--accent);"><i class="fa-solid fa-circle-check"></i> Resolución:</span>
                <span>${news.decisions}</span>
            </div>
        `;

        // Proporcionar zoom en la foto al pasar el mouse
        if (news.image_url) {
            const img = card.querySelector('.public-news-img');
            card.addEventListener('mouseenter', () => {
                if (img) img.style.transform = 'scale(1.04)';
            });
            card.addEventListener('mouseleave', () => {
                if (img) img.style.transform = 'scale(1)';
            });
            img.addEventListener('click', () => {
                openLightbox(news.title, news.content, news.date, news.type, '', '', news.image_url);
            });
        }

        list.appendChild(card);
    });
}

// 9. Global news & agreement deletion handler
window.deleteAgreement = async function(id) {
    const confirmDel = confirm("¿Estás seguro de que deseas eliminar permanentemente esta publicación (Noticia/Acuerdo) de la base de datos?");
    if (!confirmDel) return;

    // Instantly remove from local memory array to ensure UI updates immediately
    MOCK_NEWS_AGREEMENTS = MOCK_NEWS_AGREEMENTS.filter(item => item.id !== id);
    renderAgreementsList();
    renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);

    if (isSupabaseActive) {
        try {
            const { error } = await supabaseClient
                .from('agreements_news')
                .delete()
                .eq('id', id);

            if (error) throw error;
            console.log(`🗑️ Publicación ${id} eliminada.`);
            showToast("Publicación Eliminada", "El acta/boletín fue borrado de la base de datos.");
            await syncFromSupabase();
            renderAgreementsList();
            renderPublicNewsGrid(MOCK_NEWS_AGREEMENTS);
        } catch (err) {
            console.error("🔴 Error eliminando publicación de Supabase:", err);
            showToast("Error de Servidor", "No se pudo borrar del servidor.");
        }
    } else {
        showToast("Eliminado", "Publicación eliminada localmente.");
    }
};

/* ==========================================================================
   SPONSORS CAROUSEL SLIDE CONTROLLER (AUTOMATIC & RESPONSIVE)
   ========================================================================== */
function initSponsorsCarousel() {
    const track = document.getElementById('sponsors-carousel-track');
    const container = document.getElementById('sponsors-carousel-container');
    if (!track || !container) return;

    let currentIndex = 0;
    const cards = track.querySelectorAll('.sponsor-card');
    const totalCards = cards.length;
    if (totalCards === 0) return;

    function getVisibleSlidesCount() {
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        return 3;
    }

    function moveToIndex(index) {
        const visibleSlides = getVisibleSlidesCount();
        const maxIndex = totalCards - visibleSlides;
        
        if (index > maxIndex) {
            currentIndex = 0;
        } else if (index < 0) {
            currentIndex = maxIndex;
        } else {
            currentIndex = index;
        }

        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = 15;
        const offset = currentIndex * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
    }

    let autoSlideInterval = setInterval(() => {
        moveToIndex(currentIndex + 1);
    }, 3000);

    container.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });

    container.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(() => {
            moveToIndex(currentIndex + 1);
        }, 3000);
    });

    window.addEventListener('resize', () => {
        moveToIndex(currentIndex);
    });
}

/* ==========================================================================
   17. CONTABILIDAD / BOOKKEEPING TAB MODULE CONTROLLER
   ========================================================================== */
function initAccounting() {
    const accountingForm = document.getElementById('admin-accounting-form');
    
    // Set default date to today in the input field
    const dateInput = document.getElementById('acc-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0
        let dd = today.getDate();
        
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    if (accountingForm) {
        accountingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const type = document.getElementById('acc-type').value;
            const amountVal = document.getElementById('acc-amount').value;
            const dateVal = document.getElementById('acc-date').value;
            const descriptionVal = document.getElementById('acc-description').value.trim();
            
            if (!amountVal || !dateVal || !descriptionVal) {
                alert("Por favor, rellene todos los campos.");
                return;
            }
            
            const amount = parseFloat(amountVal);
            if (isNaN(amount) || amount <= 0) {
                alert("Por favor, ingrese un monto válido mayor a 0.");
                return;
            }
            
            // Build new transaction object
            const newTx = {
                id: 'tx-' + Date.now(),
                date: dateVal,
                type: type,
                amount: amount,
                description: descriptionVal
            };
            
            // Add to transaction history
            window.TRANSACTION_HISTORY.push(newTx);
            
            // Persist to LocalStorage
            localStorage.setItem('accounting-transactions', JSON.stringify(window.TRANSACTION_HISTORY));
            
            // Reset form fields
            document.getElementById('acc-amount').value = '';
            document.getElementById('acc-description').value = '';
            
            // Recalculate metrics and redraw SVG chart
            updateFinancialSummaryAndChart();
            
            // Re-render transactions list table
            renderAccountingTable();
            
            // Feedback to user
            showToast(
                type === 'ingreso' ? "🟢 Ingreso Registrado" : "🔴 Egreso Registrado",
                `Se registró "$${amount.toLocaleString('es-CL')}" por concepto de: ${descriptionVal}`
            );
        });
    }
    
    // Initial rendering of the table
    renderAccountingTable();
}

function renderAccountingTable() {
    const tableBody = document.getElementById('accounting-transactions-body');
    const sumIngresosLabel = document.getElementById('acc-sum-ingresos');
    const sumEgresosLabel = document.getElementById('acc-sum-egresos');
    const sumNetoLabel = document.getElementById('acc-sum-neto');
    
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    // Sort transactions chronologically (latest date first)
    const sortedTxs = [...window.TRANSACTION_HISTORY].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    let sumIngresos = 0;
    let sumEgresos = 0;
    
    if (sortedTxs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 25px;">
                    <i class="fa-solid fa-scale-unbalanced-stroke" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.7;"></i>
                    No hay movimientos financieros registrados en el historial.
                </td>
            </tr>
        `;
    } else {
        sortedTxs.forEach(tx => {
            const row = document.createElement('tr');
            
            let typeBadge = '';
            let amountText = '';
            
            if (tx.type === 'ingreso') {
                sumIngresos += tx.amount;
                typeBadge = `<span class="acc-badge acc-badge-ingreso"><i class="fa-solid fa-circle-arrow-down"></i> Ingreso</span>`;
                amountText = `<span style="color: #00e676; font-weight: 700;">+$${tx.amount.toLocaleString('es-CL')}</span>`;
            } else {
                sumEgresos += tx.amount;
                typeBadge = `<span class="acc-badge acc-badge-egreso"><i class="fa-solid fa-circle-arrow-up"></i> Egreso</span>`;
                amountText = `<span style="color: #ff5252; font-weight: 700;">-$${tx.amount.toLocaleString('es-CL')}</span>`;
            }
            
            row.innerHTML = `
                <td style="font-weight: 600; white-space: nowrap;"><i class="fa-solid fa-calendar-day text-gold" style="font-size: 0.72rem; margin-right: 4px;"></i> ${tx.date}</td>
                <td>${typeBadge}</td>
                <td style="word-break: break-word; font-weight: 500;">${tx.description}</td>
                <td style="white-space: nowrap;">${amountText}</td>
                <td>
                    <button class="btn-delete-acc" onclick="deleteTransaction('${tx.id}')" title="Eliminar Movimiento">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update local table summaries
    if (sumIngresosLabel) sumIngresosLabel.textContent = `$${sumIngresos.toLocaleString('es-CL')}`;
    if (sumEgresosLabel) sumEgresosLabel.textContent = `$${sumEgresos.toLocaleString('es-CL')}`;
    
    if (sumNetoLabel) {
        const net = sumIngresos - sumEgresos;
        sumNetoLabel.textContent = `$${net.toLocaleString('es-CL')}`;
        if (net >= 0) {
            sumNetoLabel.className = 'text-green';
            sumNetoLabel.style.color = '#00e676';
        } else {
            sumNetoLabel.className = 'text-red';
            sumNetoLabel.style.color = '#ff5252';
        }
    }
}

// Global action handler for transaction deletion
window.deleteTransaction = function(id) {
    const confirmDel = confirm("¿Estás seguro de que deseas eliminar permanentemente este movimiento de la contabilidad?");
    if (!confirmDel) return;
    
    const tx = window.TRANSACTION_HISTORY.find(t => t.id === id);
    const amt = tx ? tx.amount : 0;
    const desc = tx ? tx.description : "";
    
    window.TRANSACTION_HISTORY = window.TRANSACTION_HISTORY.filter(t => t.id !== id);
    
    localStorage.setItem('accounting-transactions', JSON.stringify(window.TRANSACTION_HISTORY));
    
    updateFinancialSummaryAndChart();
    renderAccountingTable();
    
    showToast(
        "Movimiento Eliminado",
        `Se eliminó de la contabilidad: "$${amt.toLocaleString('es-CL')}" por concepto de "${desc}"`
    );
};

/* ==========================================================================
   18. ALBUM CARDS & FULLSCREEN BLURRED DIRECTORY (CARPETA BLUR) CONTROLLER
   ========================================================================== */
function openAlbumModal(title, categoryKey, photos) {
    const modal = document.getElementById('album-modal');
    const mTitle = document.getElementById('album-modal-title');
    const mTag = document.getElementById('album-modal-tag');
    const mGrid = document.getElementById('album-modal-grid');

    if (!modal || !mTitle || !mTag || !mGrid) return;

    mTitle.textContent = title;
    
    // Capitalize tag
    const formattedTag = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).replace('-', ' ');
    mTag.textContent = formattedTag;
    
    mGrid.innerHTML = '';

    photos.forEach((photo, idx) => {
        const formattedDate = photo.created_at ? new Date(photo.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        
        const photoCard = document.createElement('div');
        photoCard.className = 'gallery-item cursor-pointer';
        photoCard.style.position = 'relative';
        photoCard.style.overflow = 'hidden';
        photoCard.style.borderRadius = 'var(--radius-md)';
        photoCard.style.border = '1px solid var(--border-color)';
        photoCard.style.aspectRatio = '4/3';
        photoCard.style.background = 'rgba(0,0,0,0.4)';
        photoCard.style.cursor = 'pointer';
        photoCard.style.transition = 'var(--transition)';

        photoCard.innerHTML = `
            <img src="${photo.url}" alt="${photo.caption}" class="gallery-img" style="width: 100%; height: 100%; object-fit: cover; transition: var(--transition); display: block;">
            <div class="gallery-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 15px; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0.9; transition: var(--transition);">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${photo.caption}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; font-size: 0.72rem; color: var(--text-muted);">
                    <span class="gallery-date"><i class="fa-solid fa-calendar-day"></i> ${formattedDate}</span>
                </div>
            </div>
        `;

        // Zoom hover effect
        photoCard.addEventListener('mouseenter', () => {
            const img = photoCard.querySelector('.gallery-img');
            if (img) img.style.transform = 'scale(1.04)';
        });
        photoCard.addEventListener('mouseleave', () => {
            const img = photoCard.querySelector('.gallery-img');
            if (img) img.style.transform = 'scale(1)';
        });

        // Click behavior (Lightbox modal opener)
        photoCard.addEventListener('click', () => {
            // Inicializar el set de fotos para el carrusel de Lightbox
            window.CURRENT_LIGHTBOX_ALBUM_PHOTOS = photos.map(p => {
                const pFormattedDate = p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                return {
                    title: p.caption,
                    desc: p.caption,
                    date: pFormattedDate,
                    tag: p.category,
                    visualClasses: '',
                    iconClass: '',
                    imgUrl: p.url
                };
            });
            window.CURRENT_LIGHTBOX_PHOTO_INDEX = idx;
            window.LIGHTBOX_OPENING_FROM_ALBUM = true;

            openLightbox(photo.caption, photo.caption, formattedDate, photo.category, '', '', photo.url);
        });

        mGrid.appendChild(photoCard);
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock main scroll
}

function initAlbumModalClose() {
    const closeBtn = document.getElementById('close-album-modal-btn');
    const modal = document.getElementById('album-modal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore main scroll
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}
