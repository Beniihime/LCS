<template>
    <main>
        <div class="content-wrapper">
            <h2 class="mb-4">Выберите сезон</h2>
            <div class="seasons-grid">
                <div v-for="item in 8" :key="item.id" class="season">
                    <h3>1 квартал 2025</h3>
                    <div class="content mb-4">
                        <i class="pi pi-calendar me-2"></i>
                        <span>Январь-Март</span>
                    </div>
                    <div class="content second-plan">
                        <i class="pi pi-chart-bar me-2"></i>
                        <span>Индикаторов: 12</span>
                    </div>
                    <div class="content second-plan">
                        <i class="pi pi-users me-2"></i>
                        <span>Сотрудников: 27</span>
                    </div>
                    <div class="menu">
                        <Button icon="pi pi-ellipsis-h" class="edit-btn"/>
                    </div>
                </div>
                <div class="add-season" v-tooltip.bottom="'Добавить сезон'">
                    <i class="pi pi-plus-circle my-5"></i>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref } from 'vue';


</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.seasons-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(4, 1fr);
}
.season {
    padding: 20px;
    background-color: var(--p-grey-7);
    border-radius: 18px;
    transition: all 0.5s;
    position: relative;
}
.add-season {
    padding: 20px;
    display: flex;

    background-color: var(--p-grey-7);
    border: 2px solid var(--p-grey-5);
    border-radius: 18px;

    justify-content: center;
    align-items: center;
    place-items: center;
    transition: all 0.5s;

    .pi {
        font-size: 32px;
        color: var(--p-grey-2);
        transition: all 0.5s;
    }
}
.add-season:hover {
    cursor: pointer;
    background-color: var(--p-blue-500-low-op);
    border-color: var(--p-color-icon-menu);
    .pi {
        color: var(--p-color-icon-menu);
    }
}
.menu {
    position: absolute;
    top: 20px;
    right: 20px;
} 
.season:hover {
    cursor: pointer;
    background-color: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
}
.content {
    display: flex;
    align-items: center;
    font-size: 18px;
}

.pi {
    font-size: 20px;
}
.second-plan {
    color: var(--p-grey-1);
}
.edit-btn {
    border-radius: 8px;
    color: white;
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
}
</style>