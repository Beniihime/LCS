<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrap">
            <div class="profile-card">
                <div class="profile-header">
                    <img :src="headerSrc" alt="Profile Header" class="header-image"/>
                </div>
                <div class="avatar-wrapper">
                    <Avatar :image="src" size="large" shape="circle" />
                </div>
                <div class="profile-body">
                    <div class="row justify-content-center text-center">
                        <div class="col-auto">
                            <h2>{{ fullName }}</h2>
                            <p class="profile-email">{{ email }}</p>
                            <!-- <Button 
                                label="Редактировать профиль" 
                                icon="pi pi-pencil" 
                                outlined 
                                rounded
                            />
                            <FileUpload 
                                mode="basic" 
                                @select="onFileSelect" 
                                auto
                                customUpload
                                class="p-button-outlined p-button-rounded"
                                uploadIcon="pi pi-plus"
                                chooseLabel="Выбрать фото"
                            /> -->
                        </div>
                    </div>
                    <Divider class="my-4"/>
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
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

import WelcomeScreen from '@/components/WelcomeScreen.vue'

const src = ref(null);
const loading = ref(true);
const headerSrc = ref('/src/assets/backgrounds/image.png');

const firstName = ref('');
const lastName = ref('');
const fullName = ref('');
const email = ref('');
const userRole = ref('');

function onFileSelect(event) {
    const file = event.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        src.value = e.target.result;
    };

    reader.readAsDataURL(file);
}

const fetchMeInfo = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
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
    justify-content: center;
    padding: 10pt;
    height: 100%;
    box-sizing: border-box;
}
.avatar-wrapper {
    position: absolute;
    left: 50%;
    top: 100px;
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
    max-width: 600px;
}
.profile-card {
    background-color: var(--p-grey-6);
    border-radius: 15px;
    border: 2px solid var(--p-grey-4);
    transition: all 0.5s ease;
    width: 100%;
    position: relative;
}
.profile-body {
    padding: 75px 30px 30px 30px;
    border-radius: 18px 18px 0 0;
    overflow: hidden;
}
.header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px 15px 0 0;
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
    margin-right: 10px;
}
</style>