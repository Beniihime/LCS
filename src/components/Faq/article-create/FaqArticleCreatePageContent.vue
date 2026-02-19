<template>
    <main>
        <div class="faq-article-page">
            <header class="article-header">
                <button class="back-btn" type="button" @click="goBack">
                    <i class="pi pi-arrow-left"></i>
                </button>

                <div class="article-head-center">
                    <InputText
                        v-model="question"
                        class="article-title-input"
                        placeholder="Введите заголовок статьи"
                    />
                    <div v-if="groupTitle" class="article-meta">Группа: {{ groupTitle }}</div>
                </div>

                <Button label="Создать" :disabled="!question" icon="pi pi-check" severity="success" @click="createArticle" :loading="actionLoading" />
            </header>

            <div class="article-body">
                <div class="article-blocks" v-if="blocks.length">
                    <div
                        v-for="(block, idx) in blocks"
                        :key="block.localId"
                        class="article-block is-editing"
                        :class="{ 'is-drag-over': dragOverIndex === idx }"
                        draggable="true"
                        @dragstart="onBlockDragStart(idx)"
                        @dragover.prevent="onBlockDragOver(idx)"
                        @dragleave="onBlockDragLeave"
                        @drop.prevent="onBlockDrop(idx)"
                        @dragend="onBlockDragEnd"
                    >
                        <div class="block-toolbar">
                            <i class="pi pi-bars block-drag-handle"></i>
                            <div class="block-toolbar-actions">
                                <Button icon="pi pi-pencil" text rounded @click="openEditBlockDialog(block)" />
                                <Button icon="pi pi-trash" text rounded severity="danger" @click="removeBlock(block.localId)" />
                            </div>
                        </div>

                        <div v-if="block.type === 'Image' && block.image" class="article-image is-edit-preview">
                            <img :src="getBlockImageSrc(block.image)" alt="Блок изображения" />
                        </div>
                        <div v-if="block.type === 'Image' && block.image" class="block-type-hint">
                            <i class="pi pi-image"></i>
                            <span>Блок изображения</span>
                        </div>
                        <div v-if="block.type === 'Text' && block.text" class="article-text">{{ block.text }}</div>
                    </div>
                </div>

                <button class="add-block-button" type="button" @click="openCreateBlockDialog">
                    <i class="pi pi-plus"></i>
                    <span>Добавить блок</span>
                </button>
            </div>

            <Dialog
                v-model:visible="blockDialog.visible"
                modal
                :header="blockDialog.mode === 'create' ? 'Добавить блок' : 'Изменить блок'"
                :style="{ width: '34rem' }"
            >
                <div class="faq-dialog-form">
                    <div class="faq-field">
                        <label>Тип контента</label>
                        <SelectButton
                            v-model="blockDialog.contentType"
                            :options="contentTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                        />
                    </div>

                    <div v-if="blockDialog.contentType === 'Text'" class="faq-field">
                        <label for="faq-block-text">Текст</label>
                        <InputText id="faq-block-text" v-model="blockDialog.text" class="w-100" />
                    </div>

                    <div v-else class="faq-field">
                        <label>Изображение</label>
                        <div
                            class="faq-dropzone"
                            :class="{ 'is-dragover': isDialogDragOver }"
                            @dragover.prevent="onDialogImageDragOver"
                            @dragleave.prevent="onDialogImageDragLeave"
                            @drop.prevent="onDialogImageDrop"
                            @click="openDialogImagePicker"
                        >
                            <input
                                ref="dialogImageInputRef"
                                type="file"
                                class="d-none"
                                accept="image/*"
                                @change="onDialogImageFileChange"
                            />
                            <div class="faq-dropzone-inner">
                                <i class="pi pi-image"></i>
                                <span>Перетащите изображение сюда или нажмите для выбора</span>
                            </div>
                        </div>
                        <div v-if="blockDialog.image" class="faq-image-preview">
                            <img :src="getBlockImageSrc(blockDialog.image)" alt="Предпросмотр" />
                            <Button icon="pi pi-trash" text severity="danger" label="Удалить изображение" @click="blockDialog.image = ''" />
                        </div>
                    </div>
                </div>
                <template #footer>
                    <Button label="Отмена" text severity="secondary" @click="blockDialog.visible = false" :disabled="actionLoading" />
                    <Button :label="blockDialog.mode === 'create' ? 'Добавить' : 'Сохранить'" severity="success" @click="saveBlockDialog" :loading="actionLoading" />
                </template>
            </Dialog>
        </div>
    </main>
</template>

<script setup>
import { useFaqArticleCreatePage } from '@/components/Faq/article-create/useFaqArticleCreatePage.js';

const {
    question,
    actionLoading,
    dragOverIndex,
    dialogImageInputRef,
    isDialogDragOver,
    groupTitle,
    blocks,
    blockDialog,
    contentTypeOptions,
    goBack,
    openCreateBlockDialog,
    openEditBlockDialog,
    saveBlockDialog,
    removeBlock,
    onBlockDragStart,
    onBlockDragOver,
    onBlockDragLeave,
    onBlockDrop,
    onBlockDragEnd,
    onDialogImageDragOver,
    onDialogImageDragLeave,
    onDialogImageDrop,
    openDialogImagePicker,
    onDialogImageFileChange,
    getBlockImageSrc,
    createArticle,
} = useFaqArticleCreatePage();
</script>

<style scoped>
main {
    height: 100vh;
    padding: 10px;
}
.faq-article-page {
    --article-bg-1: var(--p-bg-color-2);
    --article-bg-2: var(--p-bg-color-1);
    --article-border: var(--p-grey-4);
    --article-shadow: 0 14px 38px rgba(15, 23, 42, 0.08);
    --article-text: var(--p-text-color);
    --article-muted: var(--p-grey-1);
    font-family: "SF Pro Rounded", "Segoe UI", sans-serif;
    padding: 1.8rem 1.5rem;
    height: 100%;
    background:
        radial-gradient(900px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--article-bg-1) 0%, var(--article-bg-2) 86%);
    border-radius: 24px;
    border: 1px solid var(--article-border);
    box-shadow: var(--article-shadow);
}
.article-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.article-head-center {
    min-width: 0;
    flex: 1;
}
.article-title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.24;
    color: var(--article-text);
}
.article-title-input {
    width: 100%;
    font-size: 1.35rem;
    font-weight: 700;
    border-radius: 12px;
}
.article-meta {
    margin-top: 0.3rem;
    color: var(--article-muted);
    font-size: 0.9rem;
    width: fit-content;
    padding: 0.42rem 0.7rem;
    border-radius: 999px;
    background: var(--p-grey-4);
}
.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 1rem;
    background: var(--p-bg-color-1);
    color: var(--p-text-color);
    border: 1px solid var(--p-grey-4);
    border-radius: 2.5rem;
    font-weight: 600;
    transition: all 0.22s ease;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    cursor: pointer;
}
.article-body {
    display: flex;
    flex-direction: column;
}
.faq-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}
.faq-field label {
    font-weight: 600;
    color: var(--p-text-color);
}
.article-blocks {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}
.article-block {
    position: relative;
    background: var(--p-bg-color-1);
    border-radius: 14px;
    overflow: hidden;
    border: 1px dashed var(--p-blue-400);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    padding-top: 2.15rem;
}
.article-block.is-drag-over {
    outline: 2px solid var(--p-blue-400);
}
.block-toolbar {
    position: absolute;
    top: 0.35rem;
    left: 0.55rem;
    right: 0.55rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
}
.block-drag-handle {
    font-size: 0.95rem;
    color: var(--p-grey-1);
}
.block-toolbar-actions {
    display: flex;
    align-items: center;
}
.article-image img {
    width: 100%;
    height: auto;
    display: block;
    border-bottom: 1px solid var(--article-border);
    max-height: 460px;
    object-fit: cover;
}
.article-image.is-edit-preview {
    margin: 0.35rem 0.6rem 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-2);
}
.article-image.is-edit-preview img {
    max-height: 230px;
    object-fit: contain;
    border-bottom: 0;
}
.block-type-hint {
    padding: 0.45rem 0.85rem 0.15rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--p-grey-1);
    font-size: 0.85rem;
}
.article-text {
    padding: 1.05rem 1.2rem;
    line-height: 1.7;
    color: var(--p-text-color);
    font-size: 1rem;
    white-space: pre-wrap;
}
.add-block-button {
    margin-top: 0.9rem;
    width: 100%;
    border: 1px dashed var(--p-blue-400);
    border-radius: 12px;
    padding: 0.95rem 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    background: transparent;
    color: var(--p-blue-500);
    font-weight: 600;
}
.faq-dialog-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}
.faq-dropzone {
    border: 1px dashed var(--p-grey-3);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
}
.faq-dropzone.is-dragover,
.faq-dropzone:hover {
    border-color: var(--p-blue-400);
    background: rgba(var(--p-blue-500-rgb), 0.08);
}
.faq-dropzone-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    color: var(--p-grey-1);
}
.faq-image-preview {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
}
.faq-image-preview img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-2);
}
</style>
