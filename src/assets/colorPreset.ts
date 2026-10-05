import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'

export const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#f4f1fa',
      100: '#e7def5',
      200: '#d0bfe9',
      300: '#ad92d7',
      400: '#7e5bb9',
      500: '#462094',
      600: '#3a187a',
      700: '#301364',
      800: '#281052',
      900: '#220d43',
      950: '#140529',
    },
  },
})
