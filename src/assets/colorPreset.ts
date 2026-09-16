import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'

export const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#edf0f7',
      100: '#d7dff0',
      200: '#b4c4e2',
      300: '#849ecf',
      400: '#5272bb',
      500: '#2d50a3',
      600: '#1e3c88',
      700: '#172f6d',
      800: '#132658',
      900: '#0f1f47',
      950: '#040D2D',
    },
  },
})
