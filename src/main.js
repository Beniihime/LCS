import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ToastService from 'primevue/toastservice';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import Noir from './presets/Noir.js';

import AppState from './plugins/appState.js';
import { createPinia } from 'pinia';

import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';
import Avatar from 'primevue/avatar';
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';
import Tree from 'primevue/tree';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Badge from 'primevue/badge';
import MultiSelect from 'primevue/multiselect';
import FloatLabel from 'primevue/floatlabel';
import Password from 'primevue/password';
import AutoComplete from 'primevue/autocomplete';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Chip from 'primevue/chip';
import Popover from 'primevue/popover';
import Checkbox from 'primevue/checkbox'; 
import SelectButton from 'primevue/selectbutton';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import ToggleSwitch from 'primevue/toggleswitch';
import Menu from 'primevue/menu';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Timeline from 'primevue/timeline';
import OverlayBadge from 'primevue/overlaybadge';
import Skeleton from 'primevue/skeleton';
import Tabs from 'primevue/tabs';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Message from 'primevue/message';
import SpeedDial from 'primevue/speeddial';
import TreeSelect from 'primevue/treeselect';
import RadioButton from 'primevue/radiobutton';
import Paginator from 'primevue/paginator';
import DatePicker from 'primevue/datepicker';

const app = createApp(App);
const pinia = createPinia()

app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark',
            cssLayer: false,
        },
        ripple: true,
    },
    locale: {
        firstDayOfWeek: 1,
        dayNames: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
        dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        today: "Сегодня",
        clear: "Очистить",
        dateFormat: "dd.mm.yy",
        weekHeader: "Нед"
    }
});
app.use(AppState);
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

app.component('Button', Button);
app.component('Avatar', Avatar);
app.component('Divider', Divider);
app.component('InputText', InputText);
app.component('Tree', Tree);
app.component('Tag', Tag);
app.component('Dialog', Dialog);
app.component('Badge', Badge);
app.component('MultiSelect', MultiSelect);
app.component('FloatLabel', FloatLabel);
app.component('Password', Password);
app.component('AutoComplete', AutoComplete);
app.component('IconField', IconField);
app.component('InputIcon', InputIcon);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Textarea', Textarea);
app.component('Select', Select);
app.component('Chip', Chip);
app.component('Popover', Popover);
app.component('Checkbox', Checkbox);
app.component('SelectButton', SelectButton);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
app.component('ToggleSwitch', ToggleSwitch);
app.component('Menu', Menu);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Timeline', Timeline);
app.component('OverlayBadge', OverlayBadge);
app.component('Skeleton', Skeleton);
app.component('Tabs', Tabs);
app.component('Tab', Tab);
app.component('TabList', TabList);
app.component('TabPanel', TabPanel);
app.component('TabPanels', TabPanels);
app.component('Message', Message);
app.component('SpeedDial', SpeedDial);
app.component('TreeSelect', TreeSelect);
app.component('RadioButton', RadioButton);
app.component('Paginator', Paginator);
app.component('DatePicker', DatePicker);

app.use(pinia)
app.use(router);

app.mount('#app');