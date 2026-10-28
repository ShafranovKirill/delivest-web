import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'

export const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#f6f2f3',
      100: '#d3c2c5',
      200: '#b09297',
      300: '#8e6268',
      400: '#6b313a',
      500: '#48010c',
      600: '#3d010a',
      700: '#320108',
      800: '#280107',
      900: '#1d0005',
      950: '#120003',
    },
    colorScheme: {
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
      },
    },
  },
})
