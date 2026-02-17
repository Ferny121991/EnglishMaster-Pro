/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#edfaff',
                    100: '#d6f3ff',
                    200: '#b5ecff',
                    300: '#83e2ff',
                    400: '#48cfff',
                    500: '#1eb5ff',
                    600: '#0699ff',
                    700: '#0080ff',
                    800: '#0066cc',
                    900: '#08569f',
                    950: '#0a3460',
                },
                neon: {
                    blue: '#00D1FF',
                    purple: '#A855F7',
                    pink: '#EC4899',
                    green: '#10B981',
                    orange: '#F59E0B',
                },
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    700: '#1e293b',
                    800: '#0f172a',
                    900: '#0a0f1a',
                    950: '#050810',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'radial-gradient(ellipse at center, rgba(0,209,255,0.15) 0%, transparent 70%)',
                'card-glow': 'radial-gradient(ellipse at top, rgba(0,209,255,0.06) 0%, transparent 60%)',
            },
            boxShadow: {
                'neon': '0 0 20px rgba(0,209,255,0.3), 0 0 60px rgba(0,209,255,0.1)',
                'neon-strong': '0 0 30px rgba(0,209,255,0.5), 0 0 80px rgba(0,209,255,0.2)',
                'glass': '0 8px 32px rgba(0,0,0,0.3)',
                'glass-lg': '0 16px 48px rgba(0,0,0,0.4)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(0,209,255,0.2)' },
                    '100%': { boxShadow: '0 0 40px rgba(0,209,255,0.4), 0 0 80px rgba(0,209,255,0.1)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
};
