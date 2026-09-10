import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'

export const MyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#fdf2f3',
      100: '#fce7e9',
      200: '#f8d1d5',
      300: '#f2aeb5',
      400: '#e87c88',
      500: '#A3283D',
      600: '#8c1f32',
      700: '#75192a',
      800: '#621725',
      900: '#531521',
      950: '#2d0910',
    },
  },
})
