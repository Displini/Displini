import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// Ensure every parse call has a `from` value to silence PostCSS warnings
const originalParse = postcss.parse;
postcss.parse = (css, opts = {}) =>
  originalParse(css, { from: opts.from ?? "inline.css", ...opts });

export default {
  // Setting `from` avoids PostCSS warnings about missing source paths
  from: undefined,
  plugins: [tailwindcss, autoprefixer],
};
