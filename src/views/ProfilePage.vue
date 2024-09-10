<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrap">
            <div class="profile-card">
                <div class="profile-header">
                    <EditProfile :firstName="firstName" :lastName="lastName" />
                    <img :src="headerSrc" alt="Profile Header" class="header-image"/>
                </div>
                <div class="avatar-wrapper">
                    <Avatar :image="srcAvatar" size="large" shape="circle" style="transition: all 0.5s ease;"/>
                    <div class="avatar-overlay" @click="triggerFileUpload">
                        <div class="upload-button pi pi-camera" />
                        <input 
                            ref="fileInput" 
                            type="file" 
                            style="display: none" 
                            @change="onFileSelect"
                        />
                    </div>
                </div>
                <div class="profile-body">
                    <div class="row justify-content-center text-center">
                        <div class="col-auto">
                            <h2>{{ fullName }}</h2>
                            <p class="profile-email">{{ email }}</p>
                        </div>
                    </div>
                    <div class="bio-section">
                        <h3>О себе</h3>
                        <p>{{ bio }}</p>
                    </div>

                    <Divider class="my-4" />
                    
                    <div class="profile-info">
                        <div class="row mb-3">
                            <div class="col-auto align-items-center d-flex">
                                <i class="pi pi-user"></i>
                            </div>
                            <div class="col">
                                <span>{{ fullName }}</span>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-auto align-items-center d-flex">
                                <i class="pi pi-envelope"></i>
                            </div>
                            <div class="col">
                                <span>{{ email }}</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-auto align-items-center d-flex">
                                <i class="pi pi-sitemap"></i>
                            </div>
                            <div class="col">
                                <span>{{ userRole.title }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';

import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

import WelcomeScreen from '@/components/WelcomeScreen.vue';
import EditProfile from '@/components/EditProfile.vue';

const srcAvatar = ref(null);
const loading = ref(true);
const headerSrc = ref('/src/assets/backgrounds/image.png');
const bio = ref('');
const fileInput = ref(null);

const firstName = ref('');
const lastName = ref('');
const fullName = ref('');
const email = ref('');
const userRole = ref('');
const login = ref('');

const triggerFileUpload = () => {
  fileInput.value.click();
}

function onFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            srcAvatar.value = e.target.result; // Предпросмотр загруженного изображения
        };

        reader.readAsDataURL(file);
    }
}

const fetchMeInfo = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        login.value = response.data.login;
        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        email.value = response.data.email;
        userRole.value = response.data.roles[0];

        fullName.value = `${firstName.value} ${lastName.value}`.trim();

    } catch (error) {
        console.error('Ошибка при получении информации о пользователе: ', error);
    }

    loading.value = false;
}

onMounted(async () => {
    await fetchMeInfo();
})

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10pt;
    height: 100%;
    box-sizing: border-box;
}
.avatar-wrapper {
    position: absolute;
    left: 50%;
    top: 90px;
    transform: translateX(-50%);
    z-index: 10;
    border: 6px solid var(--p-grey-6);
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--p-grey-2);
    justify-content: center;
    align-items: center;
    display: flex;
    transition: all 0.5s ease;
}
.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.5s ease;
}
.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
    cursor: pointer;
}
.upload-button {
    color: white;
    border: none;
    background: transparent;
    margin: 0;
    font-size: 1.5rem;
}
.profile-header {
    position: relative;
    width: 100%;
    height: 150px;
    overflow: hidden;
    border-radius: 15px 15px 0 0;
}
.content-wrap {
    width: 100%;
    color: var(--p-text-color);
}
.profile-card {
    background-color: var(--p-grey-6);
    border-radius: 24px;
    border: 2px solid var(--p-grey-4);
    transition: all 0.5s ease;
    width: 100%;
    position: relative;
}
.profile-body {
    padding: 70px 30px 30px;
    border-radius: 18px 18px 0 0;
    overflow: hidden;
}
.header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 22px 22px 0 0;
}
h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
p {
    margin-bottom: 10px;
}
.profile-email {
    color: var(--p-grey-2);
    font-size: 16px;
}
.pi {
    font-size: 1.5rem;
}
.bio-section {
    margin: 20px 0;
}
</style>