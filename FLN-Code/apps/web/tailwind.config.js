/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#D48D53",      // honey-caramel beige
          secondary: "#8FA89D",    // sage green
          success: "#A4D991",      // lime-green
          warning: "#FED178",      // yellow
          error: "#FF8585",        // coral-red
          background: "#FAF6EE",   // warm light beige
          surface: "#FFFDF9",      // warm white / cream
          text: "#4A3E3D",         // deep cocoa espresso
          muted: "#8C7E74",        // warm sandy brown
        }
      },
      fontFamily: {
        child: ["Nunito", "sans-serif"],
        parent: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.06)",
        glow: "0 0 15px rgba(255, 217, 61, 0.6)",
      },
      minWidth: {
        touch: "56px",
      },
      minHeight: {
        touch: "56px",
      }
    },
  },
  plugins: [],
}
