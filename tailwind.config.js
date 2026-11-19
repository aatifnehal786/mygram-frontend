/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#25D366',
          darkGreen: '#075E54',
          teal: '#128C7E',
          light: '#DCF8C6', // sent message bubble
          chatBg: '#ECE5DD',
          chatBgDark: '#0B141A',
          panel: '#FFFFFF',
          panelDark: '#202C33',
          input: '#F0F2F5',
          inputDark: '#2A3942',
          bgDark: '#111B21',
          text: '#111B21',
          textDark: '#E9EDEF',
          muted: '#8696A0',
          tick: '#53BDEB',
        }
      }
    },
  },
  plugins: [],
}