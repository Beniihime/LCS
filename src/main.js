import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// import router from './router'
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css"
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';

axios.defaults.baseURL = 'https://development.sibadi.org';


const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: {
            ...Lara,
            semantic: {
                ...Lara.semantic,
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
                900: '{blue.300}',
                950: '{blue.400}'
            }
        }},
        options: {
            darkModeSelector: '.my-app-dark',
        }
    },
    ripple: true,
});

app.mount('#app');