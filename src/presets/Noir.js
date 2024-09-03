import { definePreset } from '@primevue/themes';
        import Aura from '@primevue/themes/aura';

        const Noir = definePreset(Aura, {
            semantic: {
                primary: {
                    50: '{blue.50}', 
                    100: '{blue.100}',
                    200: '{blue.200}',
                    300: '{blue.300}',
                    400: '{blue.400}',
                    500: '{blue.500}',
                    600: '{blue.600}',
                    700: '{blue.700}',
                    800: '{blue.800}',
                    900: '{blue.900}',
                    950: '{blue.950}'
                },
                colorScheme: {
                    light: {
                        primary: {
                        color: '{primary.500}',
                        contrastColor: '#ffffff',
                        hoverColor: '{primary.600}',
                        activeColor: '{primary.700}'
                        },
                        highlight: {
                        background: '{primary.500}',
                        focusBackground: '{primary.700}',
                        color: '#ffffff',
                        focusColor: '#ffffff'
                        },
                    },
                    dark: {
                        primary: {
                        color: '{primary.600}',
                        contrastColor: '{primary.50}',
                        hoverColor: '{primary.400}',
                        activeColor: '{primary.200}'
                        },
                        highlight: {
                        background: '{primary.50}',
                        focusBackground: '{primary.300}',
                        color: '{primary.950}',
                        focusColor: '{primary.950}'
                        }
                    }
                }
            }
        });

        export default Noir;
        