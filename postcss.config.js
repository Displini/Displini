import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    // cssnano is only used in production builds via Vite, not in dev mode
    // It's handled by Vite's build process, so we don't need to import it here
  ],
}
