<template>
    <main :class="['ido-create-page', { 'ido-create-page-public': !isUserAuthenticated }]">
        <section v-if="!isUserAuthenticated" class="ido-public-hero">
            <div class="ido-public-copy">
                <span class="ido-public-badge">Дополнительные консультации</span>
                <h1 class="ido-public-title">Подача заявки</h1>
                <p class="ido-public-description">
                    Заполните данные заказчика, выберите преподавателя и сразу получите готовый документ.
                </p>
                <div class="ido-public-points">
                    <div class="ido-public-point">
                        <i class="pi pi-check-circle"></i>
                        <span>Форма доступна публично</span>
                    </div>
                    <div class="ido-public-point">
                        <i class="pi pi-users"></i>
                        <span>Выбор преподавателя из списка</span>
                    </div>
                    <div class="ido-public-point">
                        <i class="pi pi-file-word"></i>
                        <span>Документ формируется сразу после отправки</span>
                    </div>
                </div>
            </div>
            <div class="ido-public-side">
                <div class="ido-public-card">
                    <div class="ido-public-card-title">Что понадобится</div>
                    <ul class="ido-public-list">
                        <li>Паспортные данные</li>
                        <li>Контактный телефон</li>
                        <li>Тема и объем консультации</li>
                    </ul>
                </div>
            </div>
        </section>

        <div :class="['ido-form-shell', { 'ido-form-shell-public': !isUserAuthenticated }]">
            <IdoConsultationForm />
        </div>
    </main>
</template>

<script setup>
import IdoConsultationForm from '@/components/Ido/IdoConsultationForm.vue';
import { isAuthenticated } from '@/utils/auth.js';

const isUserAuthenticated = isAuthenticated();
</script>

<style scoped>
.ido-create-page {
    height: 100%;
}

.ido-create-page-public {
    min-height: 100%;
    padding: 2rem 1.25rem 2.5rem;
    background:
        radial-gradient(circle at top left, rgba(var(--p-primary-500-rgb), 0.12), transparent 28%),
        radial-gradient(circle at top right, rgba(var(--p-primary-500-rgb), 0.08), transparent 24%),
        linear-gradient(180deg, color-mix(in srgb, var(--p-primary-500) 3%, white), #ffffff 34%);
}

.ido-public-hero {
    max-width: 1180px;
    margin: 0 auto 1.25rem;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
    gap: 1rem;
    align-items: stretch;
}

.ido-public-copy,
.ido-public-card {
    border-radius: 28px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(12px);
}

.ido-public-copy {
    padding: 2rem;
}

.ido-public-badge {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: rgba(var(--p-primary-500-rgb), 0.1);
    color: var(--p-primary-color);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.03em;
}

.ido-public-title {
    margin: 1rem 0 0;
    font-size: clamp(2rem, 3vw, 3rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
    color: #0f172a;
}

.ido-public-description {
    margin: 1rem 0 0;
    max-width: 58ch;
    font-size: 1rem;
    line-height: 1.65;
    color: #475569;
}

.ido-public-points {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin-top: 1.5rem;
}

.ido-public-point {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: rgba(var(--p-primary-500-rgb), 0.06);
    color: #1e293b;
    font-weight: 600;
}

.ido-public-point .pi {
    color: var(--p-primary-color);
}

.ido-public-side {
    display: flex;
}

.ido-public-card {
    width: 100%;
    padding: 1.5rem;
}

.ido-public-card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
}

.ido-public-list {
    margin: 1rem 0 0;
    padding-left: 1.2rem;
    color: #475569;
    line-height: 1.8;
}

.ido-form-shell {
    height: 100%;
}

.ido-form-shell-public {
    max-width: 1180px;
    margin: 0 auto;
    border-radius: 32px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.12);
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.09);
    backdrop-filter: blur(12px);
    overflow: hidden;
}

@media (max-width: 992px) {
    .ido-public-hero {
        grid-template-columns: 1fr;
    }

    .ido-public-points {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .ido-create-page-public {
        padding: 1rem 0.75rem 1.5rem;
    }

    .ido-public-copy,
    .ido-public-card {
        border-radius: 22px;
    }

    .ido-public-copy {
        padding: 1.4rem;
    }

    .ido-form-shell-public {
        border-radius: 24px;
    }
}
</style>
