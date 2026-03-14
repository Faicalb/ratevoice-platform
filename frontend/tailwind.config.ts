import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      screens: {
        xxl: '1440px',
        '3xl': '1920px'
      },
      maxWidth: {
        app: '1600px'
      }
    }
  }
};

export default config;
