# Hac ve Umre Platform - UX/UI Design Guidelines

## Design Philosophy

This platform combines **Islamic cultural authenticity** with **modern 2024 web design standards**. The design emphasizes trust, spirituality, and ease of use while incorporating contemporary animations, micro-interactions, and glassmorphism effects. The goal is to create a premium, conversion-focused experience that feels both reverent and technologically advanced.

---

## Color System

### GRADIENT RESTRICTION RULE
**CRITICAL**: NEVER use dark/saturated gradient combos (e.g., purple/pink, blue-500 to purple-600) on any UI element.
- NEVER let gradients cover more than 20% of the viewport
- NEVER apply gradients to text-heavy content or reading areas
- NEVER use gradients on small UI elements (<100px width)
- NEVER stack multiple gradient layers in the same viewport

### ENFORCEMENT RULE
IF gradient area exceeds 20% of viewport OR impacts readability, THEN fallback to solid colors.

### Primary Color Palette

```css
/* Emerald Green Family - Primary Brand Colors */
--primary-emerald: #00674F;        /* Main brand color, CTAs, headers */
--primary-sage: #7A9D7A;           /* Hover states, secondary elements */
--primary-mint: #A8D5BA;           /* Accents, badges, highlights */
--primary-light: #E8F5E9;          /* Backgrounds, cards, subtle fills */

/* Gold Accent Family - Luxury & Premium Feel */
--accent-gold: #D4AF37;            /* Premium badges, icons, borders */
--accent-gold-light: #E8D7A0;      /* Subtle accents, hover backgrounds */
--accent-gold-dark: #B8941F;       /* Active states, emphasis */

/* Neutral Palette - Base Colors */
--neutral-white: #FFFFFF;          /* Card backgrounds, content areas */
--neutral-cream: #FFF8DE;          /* Page background (warm, inviting) */
--neutral-beige: #F5F1E8;          /* Alternative backgrounds */
--neutral-gray-100: #F7F7F7;       /* Subtle backgrounds */
--neutral-gray-300: #E0E0E0;       /* Borders, dividers */
--neutral-gray-500: #9E9E9E;       /* Secondary text, placeholders */
--neutral-gray-700: #616161;       /* Body text */
--neutral-gray-900: #212121;       /* Headings, primary text */

/* Semantic Colors - Feedback & States */
--success-green: #4CAF50;          /* Success messages, confirmations */
--warning-amber: #FFA726;          /* Warnings, pending states */
--error-red: #EF5350;              /* Errors, validation messages */
--info-blue: #42A5F5;              /* Information, tips */

/* AI Chat Colors - Modern Tech Feel */
--ai-primary: #00A896;             /* AI chat interface primary */
--ai-secondary: #02C39A;           /* AI chat accents */
--ai-background: #F0FDFA;          /* AI chat background */
```

### Gradient Usage (Limited & Strategic)

**ALLOWED ONLY FOR:**
1. **Hero Section Background** (max 20% viewport):
```css
background: linear-gradient(135deg, #E8F5E9 0%, #FFF8DE 50%, #E8F5E9 100%);
```

2. **Large CTA Buttons** (primary actions only):
```css
background: linear-gradient(135deg, #00674F 0%, #7A9D7A 100%);
```

3. **Section Dividers** (decorative only):
```css
background: linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%);
```

### Color Usage Priority
1. **White (#FFFFFF)** - All cards, content areas, forms
2. **Cream (#FFF8DE)** - Page background
3. **Emerald (#00674F)** - Primary CTAs, navigation, headers
4. **Gold (#D4AF37)** - Premium badges, icons, accents
5. **Gradients** - ONLY hero sections and primary CTAs (max 20% viewport)

### Contrast Requirements
- **Text on White**: Use --neutral-gray-700 or darker
- **Text on Cream**: Use --neutral-gray-900 for headings, --neutral-gray-700 for body
- **Text on Emerald**: Always use --neutral-white
- **Text on Gold**: Use --neutral-gray-900
- **All text must meet WCAG AA contrast ratio (4.5:1 minimum)**

---

## Typography System

### Font Families

```css
/* Headings - Modern, Professional */
--font-heading: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Body Text - Readable, Clean */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Arabic Text Support (if needed) */
--font-arabic: 'Noto Kufi Arabic', 'Inter', sans-serif;
```

### Text Size Hierarchy

```css
/* Desktop Sizes */
--text-h1: 3.5rem;        /* 56px - Hero headings */
--text-h2: 2.25rem;       /* 36px - Section headings */
--text-h3: 1.875rem;      /* 30px - Card headings */
--text-h4: 1.5rem;        /* 24px - Subsection headings */
--text-h5: 1.25rem;       /* 20px - Small headings */
--text-body-lg: 1.125rem; /* 18px - Large body text */
--text-body: 1rem;        /* 16px - Default body text */
--text-body-sm: 0.875rem; /* 14px - Small text, captions */
--text-xs: 0.75rem;       /* 12px - Labels, badges */

/* Mobile Sizes (Responsive) */
@media (max-width: 768px) {
  --text-h1: 2.5rem;      /* 40px */
  --text-h2: 1.875rem;    /* 30px */
  --text-h3: 1.5rem;      /* 24px */
  --text-body: 0.875rem;  /* 14px */
}
```

### Font Weights

```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Rules
- **H1**: Space Grotesk, 56px (desktop) / 40px (mobile), font-weight: 700, line-height: 1.2
- **H2**: Space Grotesk, 36px (desktop) / 30px (mobile), font-weight: 600, line-height: 1.3
- **H3**: Space Grotesk, 30px (desktop) / 24px (mobile), font-weight: 600, line-height: 1.4
- **Body**: Inter, 16px (desktop) / 14px (mobile), font-weight: 400, line-height: 1.6
- **Small Text**: Inter, 14px, font-weight: 400, line-height: 1.5
- **Labels**: Inter, 12px, font-weight: 500, line-height: 1.4, letter-spacing: 0.5px, uppercase

---

## Spacing System

### Base Spacing Scale (8px base unit)

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
--space-4xl: 6rem;      /* 96px */
```

### Component Spacing Rules
- **Card Padding**: 1.5rem (24px) on desktop, 1rem (16px) on mobile
- **Section Padding**: 4rem (64px) vertical, 2rem (32px) horizontal
- **Grid Gap**: 2rem (32px) on desktop, 1rem (16px) on mobile
- **Button Padding**: 0.75rem 2rem (12px 32px) for primary, 0.5rem 1rem (8px 16px) for small
- **Form Field Spacing**: 1.5rem (24px) between fields
- **Content Max Width**: 1400px (centered)

---

## Button System

### Button Variants

#### 1. Primary Button (Main CTAs)
```css
.btn-primary {
  background: linear-gradient(135deg, #00674F 0%, #7A9D7A 100%);
  color: #FFFFFF;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 103, 79, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 103, 79, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:focus {
  outline: 3px solid rgba(0, 103, 79, 0.3);
  outline-offset: 2px;
}
```

#### 2. Secondary Button (Gold Accent)
```css
.btn-secondary {
  background: #D4AF37;
  color: #212121;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.btn-secondary:hover {
  background: #B8941F;
  transform: translateY(-1px);
}
```

#### 3. Outline Button (Tertiary Actions)
```css
.btn-outline {
  background: transparent;
  color: #00674F;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  border: 2px solid #00674F;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.btn-outline:hover {
  background: #00674F;
  color: #FFFFFF;
}
```

#### 4. Ghost Button (Minimal Actions)
```css
.btn-ghost {
  background: transparent;
  color: #616161;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.btn-ghost:hover {
  background: #F7F7F7;
  color: #212121;
}
```

#### 5. AI Chat Button (Chat Interface)
```css
.btn-ai {
  background: #00A896;
  color: #FFFFFF;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-ai:hover {
  background: #02C39A;
}
```

### Button Sizes
```css
.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
}
```

### Button States
- **Disabled**: `opacity: 0.5; cursor: not-allowed;`
- **Loading**: Add spinner icon, disable pointer events
- **Focus**: Always include visible focus ring (3px solid with 0.3 opacity)

---

## Card Components

### Base Card Style
```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}
```

### Tour Card (Special Design)
```css
.tour-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.tour-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
}

.tour-card-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-bottom: 3px solid #D4AF37;
}

.tour-card-content {
  padding: 1.5rem;
}

.tour-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tour-card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #212121;
  margin-bottom: 0.5rem;
}

.tour-card-operator {
  font-size: 0.875rem;
  color: #9E9E9E;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tour-card-price {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: #00674F;
}

.tour-card-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #F7F7F7;
  border-radius: 8px;
}

.tour-card-detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #616161;
}

.tour-card-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
```

### Glassmorphism Card (Premium Features)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

---

## Animation & Motion System

### Animation Principles
1. **Purposeful**: Every animation should serve a functional purpose
2. **Subtle**: Animations should enhance, not distract
3. **Fast**: Keep durations between 150ms-400ms for UI elements
4. **Natural**: Use easing functions that mimic real-world physics

### Framer Motion Implementation

#### Install Framer Motion
```bash
npm install framer-motion
```

#### Page Transitions
```javascript
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Usage in component
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {/* Page content */}
</motion.div>
```

#### Card Hover Animations
```javascript
const cardVariants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  },
  hover: { 
    scale: 1.02,
    y: -6,
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Usage
<motion.div
  className="tour-card"
  variants={cardVariants}
  initial="rest"
  whileHover="hover"
>
  {/* Card content */}
</motion.div>
```

#### Button Micro-Interactions
```javascript
const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

<motion.button
  className="btn-primary"
  variants={buttonVariants}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  transition={{ duration: 0.2 }}
>
  Rezervasyon Yap
</motion.button>
```

#### Stagger Children (List Animations)
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Usage
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {tours.map(tour => (
    <motion.div key={tour.id} variants={itemVariants}>
      <TourCard tour={tour} />
    </motion.div>
  ))}
</motion.div>
```

#### Loading Skeleton Animation
```javascript
const skeletonVariants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 1
    }
  }
};

<motion.div
  className="skeleton"
  variants={skeletonVariants}
  initial="initial"
  animate="animate"
  style={{
    background: 'linear-gradient(90deg, #E0E0E0 25%, #F7F7F7 50%, #E0E0E0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    height: '200px'
  }}
/>
```

#### Scroll-Triggered Animations
```javascript
import { motion, useScroll, useTransform } from 'framer-motion';

const { scrollYProgress } = useScroll();
const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

<motion.div style={{ opacity, scale }}>
  {/* Content that fades and scales on scroll */}
</motion.div>
```

### CSS Transitions (Fallback)
```css
/* For browsers without JS or as fallback */
.transition-base {
  transition: all 0.3s ease;
}

.transition-fast {
  transition: all 0.15s ease;
}

.transition-slow {
  transition: all 0.5s ease;
}
```

---

## Loading States

### Skeleton Screens

#### Tour Card Skeleton
```javascript
const TourCardSkeleton = () => (
  <motion.div
    className="tour-card-skeleton"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="skeleton-image"
      animate={{
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }}
      style={{
        height: '240px',
        background: 'linear-gradient(90deg, #E0E0E0 25%, #F7F7F7 50%, #E0E0E0 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '16px 16px 0 0'
      }}
    />
    <div className="skeleton-content" style={{ padding: '1.5rem' }}>
      <div className="skeleton-title" style={{
        height: '24px',
        width: '70%',
        background: '#E0E0E0',
        borderRadius: '4px',
        marginBottom: '1rem'
      }} />
      <div className="skeleton-text" style={{
        height: '16px',
        width: '50%',
        background: '#E0E0E0',
        borderRadius: '4px',
        marginBottom: '0.5rem'
      }} />
      <div className="skeleton-text" style={{
        height: '16px',
        width: '60%',
        background: '#E0E0E0',
        borderRadius: '4px'
      }} />
    </div>
  </motion.div>
);
```

#### Spinner Component
```javascript
import { motion } from 'framer-motion';

const Spinner = ({ size = 40, color = '#00674F' }) => (
  <motion.div
    style={{
      width: size,
      height: size,
      border: `3px solid rgba(0, 103, 79, 0.1)`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%'
    }}
    animate={{ rotate: 360 }}
    transition={{
      repeat: Infinity,
      duration: 1,
      ease: 'linear'
    }}
  />
);
```

### Progressive Loading
- **Images**: Use blur-up technique with low-quality placeholders
- **Content**: Load above-the-fold content first
- **Lists**: Implement infinite scroll with skeleton screens
- **Forms**: Show field-by-field validation feedback

---

## Form Design

### Form Field Styling
```css
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #212121;
  letter-spacing: 0.3px;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #212121;
  background: #FFFFFF;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #00674F;
  box-shadow: 0 0 0 3px rgba(0, 103, 79, 0.1);
}

.form-input:hover {
  border-color: #7A9D7A;
}

.form-input.error {
  border-color: #EF5350;
}

.form-input.success {
  border-color: #4CAF50;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #EF5350;
}

.form-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4CAF50;
}

.form-helper {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #9E9E9E;
}
```

### Form Validation Animation
```javascript
const errorVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  }
};

<motion.div
  className="form-error"
  variants={errorVariants}
  initial="hidden"
  animate="visible"
>
  <AlertCircle size={16} />
  <span>{errorMessage}</span>
</motion.div>
```

### Form Submission States
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitSuccess, setSubmitSuccess] = useState(false);

<motion.button
  className="btn-primary"
  disabled={isSubmitting}
  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
>
  {isSubmitting ? (
    <>
      <Spinner size={20} color="#FFFFFF" />
      <span>Gönderiliyor...</span>
    </>
  ) : submitSuccess ? (
    <>
      <CheckCircle size={20} />
      <span>Gönderildi!</span>
    </>
  ) : (
    'Gönder'
  )}
</motion.button>
```

---

## Navigation Design

### Navbar Component
```javascript
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        boxShadow: isScrolled ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Navbar content */}
    </motion.nav>
  );
};
```

### Navigation Link Hover Effect
```css
.navbar-link {
  position: relative;
  text-decoration: none;
  color: #616161;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: color 0.2s ease;
}

.navbar-link:hover {
  color: #00674F;
}

.navbar-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #D4AF37;
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.navbar-link:hover::after {
  width: 80%;
}

.navbar-link.active {
  color: #00674F;
  font-weight: 600;
}

.navbar-link.active::after {
  width: 80%;
}
```

---

## Toast Notifications (Sonner)

### Installation
```bash
npm install sonner
```

### Setup in App.js
```javascript
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      {/* Rest of app */}
    </>
  );
}
```

### Usage Examples
```javascript
import { toast } from 'sonner';

// Success
toast.success('Rezervasyon başarıyla oluşturuldu!', {
  description: 'Detaylar e-posta adresinize gönderildi.',
  icon: '✅'
});

// Error
toast.error('Bir hata oluştu', {
  description: 'Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.',
  icon: '❌'
});

// Info
toast.info('Yeni turlar eklendi', {
  description: '5 yeni Umre turu listelendi.',
  icon: 'ℹ️'
});

// Warning
toast.warning('Oturum süreniz dolmak üzere', {
  description: 'Lütfen işlemlerinizi kaydedin.',
  icon: '⚠️'
});

// Loading
const loadingToast = toast.loading('Turlar yükleniyor...');
// Later...
toast.success('Turlar yüklendi!', { id: loadingToast });

// Custom with action
toast('Karşılaştırmaya eklendi', {
  description: 'Tur karşılaştırma listesine eklendi.',
  action: {
    label: 'Görüntüle',
    onClick: () => navigate('/compare')
  }
});
```

---

## Empty States

### Empty State Component
```javascript
import { motion } from 'framer-motion';
import { Package, Search, AlertCircle } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Package, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => (
  <motion.div
    className="empty-state"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center'
    }}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #FFF8DE 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}
    >
      <Icon size={48} color="#00674F" />
    </motion.div>
    
    <h3 style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#212121',
      marginBottom: '0.5rem'
    }}>
      {title}
    </h3>
    
    <p style={{
      fontSize: '1rem',
      color: '#616161',
      maxWidth: '400px',
      marginBottom: '2rem'
    }}>
      {description}
    </p>
    
    {actionLabel && onAction && (
      <motion.button
        className="btn-primary"
        onClick={onAction}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {actionLabel}
      </motion.button>
    )}
  </motion.div>
);

// Usage examples:
// No tours found
<EmptyState
  icon={Search}
  title="Tur bulunamadı"
  description="Arama kriterlerinize uygun tur bulunamadı. Lütfen farklı filtreler deneyin."
  actionLabel="Filtreleri Temizle"
  onAction={clearFilters}
/>

// Empty comparison
<EmptyState
  icon={Package}
  title="Karşılaştırma listesi boş"
  description="Henüz karşılaştırmak için tur eklemediniz. Turları karşılaştırarak en uygun seçeneği bulun."
  actionLabel="Turları Görüntüle"
  onAction={() => navigate('/tours')}
/>
```

---

## Error States

### Error Boundary Component
```javascript
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <AlertTriangle size={64} color="#EF5350" />
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '1.875rem',
            fontWeight: 600,
            color: '#212121',
            marginTop: '1.5rem',
            marginBottom: '0.5rem'
          }}>
            Bir şeyler yanlış gitti
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#616161',
            maxWidth: '500px',
            marginBottom: '2rem'
          }}>
            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 404 Page
```javascript
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <motion.h1
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '8rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00674F 0%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}
      >
        404
      </motion.h1>
      
      <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '2rem',
        fontWeight: 600,
        color: '#212121',
        marginBottom: '1rem'
      }}>
        Sayfa Bulunamadı
      </h2>
      
      <p style={{
        fontSize: '1.125rem',
        color: '#616161',
        maxWidth: '500px',
        marginBottom: '2rem'
      }}>
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <motion.button
          className="btn-outline"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} />
          Geri Dön
        </motion.button>
        
        <motion.button
          className="btn-primary"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={20} />
          Ana Sayfa
        </motion.button>
      </div>
    </motion.div>
  );
};
```

---

## Badge System

### Badge Variants
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.badge-primary {
  background: #E8F5E9;
  color: #00674F;
}

.badge-gold {
  background: #E8D7A0;
  color: #B8941F;
}

.badge-success {
  background: #E8F5E9;
  color: #4CAF50;
}

.badge-warning {
  background: #FFF3E0;
  color: #FFA726;
}

.badge-error {
  background: #FFEBEE;
  color: #EF5350;
}

.badge-info {
  background: #E3F2FD;
  color: #42A5F5;
}

.badge-ai {
  background: #F0FDFA;
  color: #00A896;
}

.badge-premium {
  background: linear-gradient(135deg, #D4AF37 0%, #E8D7A0 100%);
  color: #212121;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}
```

---

## Comparison View Design

### Comparison Table Styling
```css
.comparison-container {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.comparison-header {
  background: linear-gradient(135deg, #E8F5E9 0%, #FFF8DE 100%);
  border-radius: 12px 12px 0 0;
}

.comparison-header th {
  padding: 1.5rem 1rem;
  text-align: left;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #212121;
  border-bottom: 3px solid #D4AF37;
}

.comparison-row {
  border-bottom: 1px solid #E0E0E0;
  transition: background 0.2s ease;
}

.comparison-row:hover {
  background: #F7F7F7;
}

.comparison-cell {
  padding: 1rem;
  font-size: 0.875rem;
  color: #616161;
}

.comparison-cell-label {
  font-weight: 600;
  color: #212121;
}

.comparison-highlight {
  background: #E8F5E9;
  font-weight: 600;
  color: #00674F;
}

.comparison-best-value {
  position: relative;
}

.comparison-best-value::before {
  content: '⭐ En İyi Değer';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #D4AF37;
  color: #212121;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
```

---

## Chat Interface Design

### Chat Container
```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #00A896 0%, #02C39A 100%);
  color: #FFFFFF;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #F0FDFA;
}

.chat-message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00674F 0%, #7A9D7A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-message.user .chat-avatar {
  background: linear-gradient(135deg, #D4AF37 0%, #E8D7A0 100%);
  color: #212121;
}

.chat-bubble {
  max-width: 70%;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212121;
}

.chat-message.user .chat-bubble {
  background: linear-gradient(135deg, #00674F 0%, #7A9D7A 100%);
  color: #FFFFFF;
}

.chat-input-container {
  padding: 1.5rem;
  background: #FFFFFF;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 1rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #E0E0E0;
  border-radius: 24px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  outline: none;
  border-color: #00A896;
}

.chat-send-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00A896 0%, #02C39A 100%);
  border: none;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-send-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 168, 150, 0.3);
}

.chat-send-button:active {
  transform: scale(0.95);
}
```

### Typing Indicator
```javascript
const TypingIndicator = () => (
  <motion.div
    className="chat-message"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="chat-avatar">AI</div>
    <div className="chat-bubble" style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '1rem'
    }}>
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00A896'
        }}
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00A896'
        }}
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00A896'
        }}
      />
    </div>
  </motion.div>
);
```

---

## Dashboard Design

### Dashboard Grid Layout
```css
.dashboard-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.25rem;
  font-weight: 700;
  color: #212121;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: #616161;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #E8F5E9 0%, #FFF8DE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00674F;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #9E9E9E;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.875rem;
  font-weight: 700;
  color: #212121;
}

.stat-change {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.stat-change.positive {
  color: #4CAF50;
}

.stat-change.negative {
  color: #EF5350;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
```

---

## Hero Section Design

### Hero Component
```javascript
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="hero-section" style={{
      background: 'linear-gradient(135deg, #E8F5E9 0%, #FFF8DE 50%, #E8F5E9 100%)',
      padding: '6rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23D4AF37" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.h1
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: '#212121',
              marginBottom: '1rem',
              lineHeight: 1.2
            }}
          >
            Hac ve Umre Turlarını{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00674F 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Karşılaştırın
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontSize: '1.25rem',
              color: '#616161',
              maxWidth: '700px',
              margin: '0 auto 2rem'
            }}
          >
            En uygun fiyatlı ve kaliteli Hac ve Umre turlarını bulun. 
            Tüm operatörleri tek platformda karşılaştırın.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="hero-search-tours-button"
            >
              <Search size={20} />
              Turları Keşfet
            </motion.button>

            <motion.button
              className="btn-outline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="hero-compare-button"
            >
              Karşılaştır
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="glass-card"
          style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Tur Tipi
              </label>
              <select className="form-input" data-testid="hero-tour-type-select">
                <option>Umre</option>
                <option>Hac</option>
                <option>Hac + Umre</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Tarih
              </label>
              <input 
                type="date" 
                className="form-input"
                data-testid="hero-date-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <motion.button
                className="btn-primary"
                style={{ width: '100%' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="hero-search-submit-button"
              >
                <Search size={20} />
                Ara
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

---

## Image Assets

### Hero Section Images
```javascript
const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1720482229376-d5574ffeb0c8",
    description: "Kaaba aerial view - Hero background",
    category: "hero"
  },
  {
    url: "https://images.unsplash.com/photo-1617182195886-21a605900f11",
    description: "Masjid al-Haram pilgrims - Hero section",
    category: "hero"
  }
];
```

### Tour Card Images
```javascript
const tourImages = [
  {
    url: "https://images.unsplash.com/photo-1704104501136-8f35402af395",
    description: "Pilgrims at Kaaba - Tour card image",
    category: "tour-card"
  },
  {
    url: "https://images.unsplash.com/photo-1647177156430-28fcb2d4011f",
    description: "Mecca architecture - Tour card image",
    category: "tour-card"
  }
];
```

### Testimonial/User Images
```javascript
const userImages = [
  {
    url: "https://images.unsplash.com/photo-1603761501859-3da6d55372e0",
    description: "Muslim family traveling - Testimonials",
    category: "testimonial"
  },
  {
    url: "https://images.unsplash.com/photo-1740843202723-8330ce3340c1",
    description: "Traveler with luggage - User stories",
    category: "testimonial"
  }
];
```

### Hotel/Accommodation Images
```javascript
const hotelImages = [
  {
    url: "https://images.unsplash.com/photo-1630585574982-aacb8afbf617",
    description: "Luxury Islamic hotel interior - Accommodation",
    category: "hotel"
  },
  {
    url: "https://images.unsplash.com/photo-1690812304112-df39679c5797",
    description: "Grand hotel hall - Premium accommodation",
    category: "hotel"
  },
  {
    url: "https://images.unsplash.com/photo-1746173098875-3b56381b09b3",
    description: "Modern waiting room - Hotel amenities",
    category: "hotel"
  }
];
```

---

## Component Library Usage

### Shadcn/ui Components to Use

#### From `/app/frontend/src/components/ui/`:

1. **Button** (`button.jsx`) - Use for all button variants
2. **Card** (`card.jsx`) - Base for tour cards, stat cards
3. **Badge** (`badge.jsx`) - For tour features, status indicators
4. **Dialog** (`dialog.jsx`) - For modals, confirmations
5. **Dropdown Menu** (`dropdown-menu.jsx`) - For user menus, filters
6. **Form** (`form.jsx`) - For all form implementations
7. **Input** (`input.jsx`) - For text inputs
8. **Select** (`select.jsx`) - For dropdowns
9. **Textarea** (`textarea.jsx`) - For long text inputs
10. **Calendar** (`calendar.jsx`) - For date selection
11. **Tabs** (`tabs.jsx`) - For dashboard sections, tour details
12. **Table** (`table.jsx`) - For comparison view
13. **Skeleton** (`skeleton.jsx`) - For loading states
14. **Toast** (`toast.jsx`) + **Toaster** (`toaster.jsx`) - For notifications
15. **Sonner** (`sonner.jsx`) - Preferred toast system
16. **Alert** (`alert.jsx`) - For important messages
17. **Alert Dialog** (`alert-dialog.jsx`) - For confirmations
18. **Tooltip** (`tooltip.jsx`) - For helpful hints
19. **Popover** (`popover.jsx`) - For additional info
20. **Separator** (`separator.jsx`) - For visual dividers
21. **Progress** (`progress.jsx`) - For loading indicators
22. **Switch** (`switch.jsx`) - For toggles
23. **Checkbox** (`checkbox.jsx`) - For selections
24. **Radio Group** (`radio-group.jsx`) - For single selections
25. **Slider** (`slider.jsx`) - For price ranges
26. **Scroll Area** (`scroll-area.jsx`) - For scrollable content
27. **Sheet** (`sheet.jsx`) - For mobile menus
28. **Accordion** (`accordion.jsx`) - For FAQs, expandable content
29. **Avatar** (`avatar.jsx`) - For user profiles
30. **Carousel** (`carousel.jsx`) - For image galleries

### Component Import Pattern
```javascript
// Always use named imports from shadcn components
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from './components/ui/dialog';
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus indicators required (3px solid outline with 0.3 opacity)
- Logical tab order maintained
- Skip links for main content

#### Screen Reader Support
```javascript
// Always include proper ARIA labels
<button aria-label="Turu karşılaştırmaya ekle">
  <Plus size={20} />
</button>

// Use semantic HTML
<nav aria-label="Ana navigasyon">
  <ul>
    <li><a href="/">Ana Sayfa</a></li>
  </ul>
</nav>

// Provide alternative text for images
<img 
  src={tourImage} 
  alt="Mekke'de Kabe'nin havadan görünümü" 
/>

// Use proper heading hierarchy
<h1>Ana Başlık</h1>
<h2>Alt Başlık</h2>
<h3>Bölüm Başlığı</h3>
```

#### Form Accessibility
```javascript
<div className="form-group">
  <label htmlFor="tour-name" className="form-label">
    Tur Adı
  </label>
  <input
    id="tour-name"
    type="text"
    className="form-input"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "tour-name-error" : undefined}
    data-testid="tour-name-input"
  />
  {hasError && (
    <div id="tour-name-error" className="form-error" role="alert">
      Tur adı gereklidir
    </div>
  )}
</div>
```

#### Loading States
```javascript
<div role="status" aria-live="polite" aria-busy="true">
  <Spinner />
  <span className="sr-only">Turlar yükleniyor...</span>
</div>
```

### Screen Reader Only Class
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Mobile Optimizations
```css
@media (max-width: 768px) {
  /* Typography */
  h1 { font-size: 2.5rem; }
  h2 { font-size: 1.875rem; }
  h3 { font-size: 1.5rem; }
  body { font-size: 0.875rem; }
  
  /* Spacing */
  .main-content { padding: 1rem 0.5rem; }
  .section { padding: 2rem 1rem; }
  
  /* Grid */
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  
  /* Cards */
  .card { padding: 1rem; }
  .tour-card-image { height: 200px; }
  
  /* Buttons */
  .btn { padding: 0.625rem 1.5rem; font-size: 0.875rem; }
  
  /* Navigation */
  .navbar-content { flex-direction: column; gap: 1rem; }
  .navbar-links { flex-direction: column; width: 100%; }
  
  /* Dashboard */
  .dashboard-content { grid-template-columns: 1fr; }
  .dashboard-stats { grid-template-columns: 1fr; }
  
  /* Comparison */
  .comparison-container { padding: 1rem; }
  .comparison-table { font-size: 0.75rem; }
  
  /* Chat */
  .chat-bubble { max-width: 85%; }
}
```

### Touch Targets
- Minimum touch target size: 44x44px
- Adequate spacing between interactive elements (8px minimum)
- Larger buttons on mobile devices

---

## Performance Optimization

### Image Optimization
```javascript
// Use lazy loading for images
<img 
  src={tourImage} 
  alt="Tour image"
  loading="lazy"
  decoding="async"
/>

// Implement blur-up technique
const [imageLoaded, setImageLoaded] = useState(false);

<div style={{ position: 'relative' }}>
  <img
    src={lowQualityPlaceholder}
    alt="Tour"
    style={{
      filter: imageLoaded ? 'none' : 'blur(10px)',
      transition: 'filter 0.3s ease'
    }}
  />
  <img
    src={highQualityImage}
    alt="Tour"
    onLoad={() => setImageLoaded(true)}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: imageLoaded ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}
  />
</div>
```

### Code Splitting
```javascript
// Lazy load routes
import { lazy, Suspense } from 'react';

const ToursPage = lazy(() => import('./pages/ToursPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/tours" element={<ToursPage />} />
    <Route path="/compare" element={<ComparePage />} />
  </Routes>
</Suspense>
```

### Animation Performance
```javascript
// Use transform and opacity for animations (GPU accelerated)
// Avoid animating: width, height, top, left, margin, padding

// Good ✅
<motion.div
  animate={{ 
    opacity: 1, 
    scale: 1, 
    x: 0, 
    y: 0 
  }}
/>

// Bad ❌
<motion.div
  animate={{ 
    width: '100%', 
    marginLeft: '20px' 
  }}
/>
```

---

## Testing Guidelines

### Data Test IDs
All interactive and key informational elements **MUST** include a `data-testid` attribute:

```javascript
// Buttons
<button data-testid="tour-book-button">Rezervasyon Yap</button>
<button data-testid="tour-compare-button">Karşılaştır</button>
<button data-testid="tour-details-button">Detaylar</button>

// Forms
<input data-testid="search-input" />
<select data-testid="tour-type-select" />
<button data-testid="search-submit-button">Ara</button>

// Navigation
<a data-testid="nav-home-link">Ana Sayfa</a>
<a data-testid="nav-tours-link">Turlar</a>
<a data-testid="nav-compare-link">Karşılaştır</a>

// Cards
<div data-testid={`tour-card-${tour.id}`}>
  <h3 data-testid="tour-card-title">{tour.name}</h3>
  <span data-testid="tour-card-price">{tour.price}</span>
</div>

// Modals/Dialogs
<div data-testid="booking-modal">
  <button data-testid="booking-confirm-button">Onayla</button>
  <button data-testid="booking-cancel-button">İptal</button>
</div>

// Error/Success Messages
<div data-testid="error-message">{error}</div>
<div data-testid="success-message">{success}</div>

// Loading States
<div data-testid="loading-spinner">Yükleniyor...</div>
<div data-testid="tour-list-skeleton">Skeleton...</div>
```

### Naming Convention
- Use kebab-case: `data-testid="tour-card-title"`
- Be descriptive: Define element's role, not appearance
- Be specific: Include context when needed (`tour-card-${id}`)

---

## Additional Libraries & Installation

### Required Libraries

#### 1. Framer Motion (Animations)
```bash
npm install framer-motion
```

#### 2. Lucide React (Icons)
```bash
npm install lucide-react
```

#### 3. Sonner (Toast Notifications)
```bash
npm install sonner
```

#### 4. React Router DOM (Navigation)
```bash
npm install react-router-dom
```

#### 5. Date-fns (Date Formatting)
```bash
npm install date-fns
```

### Optional Enhancements

#### Recharts (Dashboard Charts)
```bash
npm install recharts
```

Usage example:
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
    <XAxis dataKey="name" stroke="#616161" />
    <YAxis stroke="#616161" />
    <Tooltip />
    <Line 
      type="monotone" 
      dataKey="bookings" 
      stroke="#00674F" 
      strokeWidth={2}
      dot={{ fill: '#D4AF37', r: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
```

#### React Intersection Observer (Scroll Animations)
```bash
npm install react-intersection-observer
```

Usage example:
```javascript
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const AnimatedSection = ({ children }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Install required libraries (Framer Motion, Lucide React, Sonner)
2. ✅ Update color system in CSS variables
3. ✅ Implement typography system
4. ✅ Create button variants
5. ✅ Setup toast notifications (Sonner)

### Phase 2: Core Components (Week 2)
1. ✅ Redesign tour cards with animations
2. ✅ Implement loading skeletons
3. ✅ Create empty states
4. ✅ Design error states
5. ✅ Update form styling with validation

### Phase 3: Page Improvements (Week 3)
1. ✅ Redesign hero section
2. ✅ Improve navigation with animations
3. ✅ Enhance comparison view
4. ✅ Modernize chat interface
5. ✅ Update dashboard with stats cards

### Phase 4: Polish & Optimization (Week 4)
1. ✅ Add micro-interactions throughout
2. ✅ Implement scroll animations
3. ✅ Optimize performance
4. ✅ Test accessibility
5. ✅ Mobile responsiveness testing

---

## Common Mistakes to Avoid

### ❌ Don't:
- Use dark purple, dark blue, dark pink gradients
- Mix multiple gradient directions in same section
- Use gradients on small UI elements
- Skip responsive font sizing
- Forget hover and focus states
- Use generic emoji icons (🤖💡🎯 etc.) - Use Lucide React icons instead
- Apply `transition: all` globally - Specify properties
- Center align all text with `.App { text-align: center; }`
- Use HTML-based dropdowns/calendars - Use Shadcn components

### ✅ Do:
- Keep gradients for hero sections and major CTAs only (max 20% viewport)
- Use solid colors for content and reading areas
- Maintain consistent spacing using the spacing system
- Test on mobile devices with touch interactions
- Include accessibility features (focus states, contrast, ARIA labels)
- Use Lucide React icons for all iconography
- Add `data-testid` to all interactive elements
- Use Shadcn/ui components from `/app/frontend/src/components/ui/`
- Implement Framer Motion for smooth animations
- Use Sonner for toast notifications

---

## Quick Reference

### Color Usage Priority
1. **White (#FFFFFF)** - Cards, content areas
2. **Cream (#FFF8DE)** - Page background
3. **Emerald (#00674F)** - Primary CTAs, navigation
4. **Gold (#D4AF37)** - Premium badges, accents
5. **Gradients** - ONLY hero & primary CTAs (max 20% viewport)

### Typography Quick Reference
- **H1**: Space Grotesk, 56px (desktop) / 40px (mobile), 700 weight
- **H2**: Space Grotesk, 36px (desktop) / 30px (mobile), 600 weight
- **Body**: Inter, 16px (desktop) / 14px (mobile), 400 weight

### Spacing Quick Reference
- **Card padding**: 1.5rem (24px)
- **Section padding**: 4rem vertical, 2rem horizontal
- **Grid gap**: 2rem (32px)
- **Button padding**: 0.75rem 2rem

### Animation Durations
- **Fast**: 150ms (hover states)
- **Normal**: 300ms (transitions)
- **Slow**: 500ms (page transitions)

---

## Support & Resources

### Documentation Links
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide React Icons](https://lucide.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Sonner Toast](https://sonner.emilkowal.ski/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Design Inspiration
- Dribbble: Search "Hajj Umrah booking"
- Behance: Search "Islamic travel platform"
- Awwwards: Modern travel websites

---

# General UI/UX Design Guidelines

## Universal Transition Rule
- You must **not** apply universal transition: `transition: all`
- This breaks transforms and causes performance issues
- Always add transitions for specific properties: `transition: background 0.2s ease, color 0.2s ease`
- Exclude transforms from general transitions

## Text Alignment Rule
- You must **not** center align the app container
- Do NOT add `.App { text-align: center; }` in CSS
- This disrupts natural reading flow
- Only center specific elements when needed

## Icon Usage Rule
- NEVER use emoji characters for icons (🤖🧠💭💡🔮🎯 etc.)
- Always use **Lucide React** library (already installed)
- Import icons: `import { Search, Calendar, User } from 'lucide-react'`
- Alternative: FontAwesome CDN if needed

## Gradient Restriction Rule (CRITICAL)
- NEVER use dark/saturated gradient combos (purple/pink, blue-500 to purple-600)
- NEVER let gradients cover more than 20% of viewport
- NEVER apply gradients to text-heavy content or reading areas
- NEVER use gradients on small UI elements (<100px width)
- NEVER stack multiple gradient layers in same viewport

### Enforcement Rule
IF gradient area exceeds 20% of viewport OR impacts readability, THEN use solid colors

### Allowed Gradient Usage
- Hero/landing section backgrounds (ensure text readability)
- Section backgrounds (not content blocks)
- Large CTA buttons / major interactive elements (light/simple gradients only)
- Decorative overlays and accent elements

## Micro-Interactions Rule
- Every interaction needs micro-animations
- Hover states, transitions, entrance animations required
- Use Framer Motion for smooth animations
- Static designs are unacceptable

## Spacing Rule
- Use 2-3x more spacing than feels comfortable
- Cramped designs look unprofessional
- Follow the 8px spacing system strictly

## Visual Enhancement Rule
- Add subtle grain textures or noise overlays where appropriate
- Implement custom cursor styles for interactive elements
- Design clear selection states
- Create engaging loading animations
- Use 2-4 color gradients for depth (following gradient restrictions)

## Design Token Priority
- Before generating UI, infer visual style from problem statement
- Set global design tokens immediately (primary, secondary, background, foreground)
- Don't rely on library defaults
- Understand the problem first, then define colors accordingly
- Don't default to dark backgrounds - analyze the use case

## Component Reuse Rule
- Prioritize pre-existing components from `src/components/ui`
- Create new components matching existing style and conventions
- Examine existing components before creating new ones
- Use Shadcn/UI as primary component library

## Component Usage Rule
- Do NOT use HTML-based components (dropdown, calendar, toast)
- MUST always use `/app/frontend/src/components/ui/` components
- These are modern, stylish, and accessible

## Export Convention Rule
- Components: Use named exports (`export const ComponentName = ...`)
- Pages: Use default exports (`export default function PageName() {...}`)

## Toast Notification Rule
- Use `sonner` for all toast notifications
- Sonner component located in `/app/frontend/src/components/ui/sonner.jsx`
- Import: `import { toast } from 'sonner'`

## Visual Depth Rule
- Use 2-4 color gradients for backgrounds (following restrictions)
- Add subtle textures/noise overlays
- Implement CSS-based noise to avoid flat visuals
- Create depth without overwhelming the design

## Accessibility Rule (CRITICAL)
- All interactive elements MUST include `data-testid` attribute
- Use kebab-case naming convention
- Define element's role, not appearance
- Examples: `data-testid="login-form-submit-button"`
- This creates stable interface for automated testing

## Calendar Component Rule
- If calendar is required, always use Shadcn calendar component
- Located at `/app/frontend/src/components/ui/calendar.jsx`
- Do NOT use HTML date inputs for complex date selection

## Design Quality Standards
- Result must feel human-made, not AI-generated
- Visually appealing and conversion-focused
- Good contrast and balanced font sizes
- Proper gradient usage (limited and strategic)
- Sufficient whitespace
- Thoughtful motion and hierarchy
- Avoid overuse of elements
- Deliver polished, effective design system

---

**END OF DESIGN GUIDELINES**

This document should be read and followed by the main implementation agent. All design decisions, component choices, animations, and styling should adhere to these guidelines to create a cohesive, modern, and accessible Hac ve Umre tour comparison platform.
