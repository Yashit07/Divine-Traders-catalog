/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      colors: {
        ivory:   { 50:'#fefbf6', 100:'#fbf5ea', 200:'#f5ecd8' },
        blush:   { 50:'#fdf3ec', 100:'#f7ded0', 200:'#f2c9b3', 300:'#ecb497', 400:'#e19a7a', 500:'#c9765a', 600:'#a35a44' },
        rose:    { 50:'#fbeef1', 100:'#f4d3dc', 200:'#e9a7b8', 300:'#d97b95', 400:'#c4547a', 500:'#a63d5a', 600:'#822a44' },
        gold:    { 50:'#fbf5e6', 100:'#f5e4c3', 200:'#ecd096', 300:'#e0b869', 400:'#d4a374', 500:'#b8853f', 600:'#8f682f' },
        cocoa:   { 500:'#5c4033', 700:'#3e2a22', 900:'#2b1810' },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(196, 84, 122, 0.18)',
        card: '0 8px 30px -14px rgba(43, 24, 16, 0.15)',
        glow: '0 0 40px rgba(212, 163, 116, 0.35)',
        hero: '0 24px 60px -30px rgba(166, 61, 90, 0.35)',
      },
      backgroundImage: {
        'warm-cream': 'linear-gradient(180deg, #fefbf6 0%, #fbf5ea 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'pop': 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2.4s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity:0, transform:'translateY(6px)' }, '100%': { opacity:1, transform:'translateY(0)' } },
        pop:    { '0%': { transform:'scale(0.85)', opacity:0 }, '100%': { transform:'scale(1)', opacity:1 } },
        shimmer:{ '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
        float:  { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-6px)' } },
        slideUp:{ '0%': { transform:'translateY(24px)', opacity:0 }, '100%': { transform:'translateY(0)', opacity:1 } },
      },
    },
  },
  plugins: [],
}
