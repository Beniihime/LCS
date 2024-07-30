import { createRouter, createWebHistory } from "vue-router";
import Home from "./components/Home.vue";
import AuthPage from './components/AuthPage.vue';

const routes = [
    { 
        path: "/", 
        component: Home,
        props: route => ({ message: route.params.message, detail: route.params.detail })
    }, 
    { 
        path: "/auth", 
        component: AuthPage 
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;