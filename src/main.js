import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css"
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import Noir from './presets/Noir.js';
import AppState from './plugins/appState.js';

axios.defaults.baseURL = 'https://development.sibadi.org';


const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark',
            cssLayer: false,
        },
        ripple: true,
    }
});
app.use(AppState);
app.use(ToastService);
app.component('Toast', Toast);
app.use(ConfirmationService);


app.use(router);
app.mount('#app');