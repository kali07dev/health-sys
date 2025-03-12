// app/styles/theme.ts
export const theme = {
    colors: {
      // Primary Apple-inspired red colors
      primary: {
        light: '#FF6B6B',
        main: '#FF3B30',  // Apple's red
        dark: '#D62617',
      },
      // Supporting colors
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
      // Notification type colors
      notification: {
        info: {
          bg: '#EBF5FF',
          text: '#1E40AF',
        },
        alert: {
          bg: '#FEF2F2',
          text: '#B91C1C',
        },
        success: {
          bg: '#ECFDF5',
          text: '#065F46',
        },
      },
    },
    // Standard border radius values throughout the app
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    // Shadows for different elevation levels
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    // Animation durations
    animation: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    // Font styles based on Apple's SF Pro
    typography: {
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
    },
  };