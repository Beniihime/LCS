import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/utils/axios.js';
import formatDate from '@/utils/formatDate.js';
import { FAQ_ADMIN_SEGMENT, USE_SU_FAQ_ENDPOINTS } from '@/mocks/config.js';

const SAVE_DELAY_MS = 350;

const fileToBase64Data = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = String(reader.result || '');
        const payload = result.includes(',') ? result.split(',')[1] : result;
        resolve(payload);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const normalizeBlockType = (block) => {
    const source = block?.contentTypes || block?.type || 'Text';
    const normalized = String(source).toLowerCase();
    return normalized.includes('image') ? 'Image' : 'Text';
};

const isTempBlockId = (id) => String(id || '').startsWith('tmp-');
const createTempBlockId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const faqWriteEndpoint = (path) => {
    if (!USE_SU_FAQ_ENDPOINTS) return `/api/faq/${path}`;
    return `/api/faq/${FAQ_ADMIN_SEGMENT}/${path}`;
};

export const useFaqArticlePage = () => {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const article = ref(null);
    const loading = ref(false);
    const error = ref('');
    const actionLoading = ref(false);
    const editMode = ref(false);

    const headerMenuRef = ref(null);
    const dialogImageInputRef = ref(null);
    const isDialogDragOver = ref(false);

    const dragFromIndex = ref(-1);
    const dragOverIndex = ref(-1);

    const originalArticleSnapshot = ref(null);
    const originalBlocksById = ref(new Map());

    const articleDialog = ref({
        visible: false,
        question: '',
    });

    const deleteArticleDialog = ref(false);

    const blockDialog = ref({
        visible: false,
        mode: 'create',
        blockId: '',
        contentType: 'Text',
        text: '',
        image: '',
        order: 0,
    });

    const deleteBlockDialog = ref({
        visible: false,
        blockId: '',
    });

    const pendingArticleChanged = ref(false);
    const pendingCreatedBlockIds = ref(new Set());
    const pendingDeletedBlockIds = ref(new Set());
    const pendingUpdatedBlockIds = ref(new Set());

    const contentTypeOptions = [
        { label: 'Текст', value: 'Text' },
        { label: 'Изображение', value: 'Image' },
    ];

    const currentUserId = ref(localStorage.getItem('userId') || '');
    const isAuthor = computed(() => {
        if (!article.value) return false;
        return String(article.value.authorId || '') === String(currentUserId.value || '');
    });
    const canEdit = computed(() => isAuthor.value);

    const sortedBlocks = computed(() => {
        if (!article.value?.blocks?.length) return [];
        return [...article.value.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    const hasPendingChanges = computed(() => (
        pendingArticleChanged.value ||
        pendingCreatedBlockIds.value.size > 0 ||
        pendingDeletedBlockIds.value.size > 0 ||
        pendingUpdatedBlockIds.value.size > 0
    ));

    const headerMenuItems = computed(() => ([
        {
            label: 'Изменить статью',
            icon: 'pi pi-pen-to-square',
            command: () => openArticleEdit(),
        },
        {
            label: 'Удалить статью',
            icon: 'pi pi-trash',
            class: 'faq-danger-item',
            command: () => { deleteArticleDialog.value = true; },
        },
    ]));

    const getBlockImageSrc = (imageRaw) => {
        if (!imageRaw) return '';
        if (String(imageRaw).startsWith('data:image')) return imageRaw;
        return `data:image/jpeg;base64,${imageRaw}`;
    };

    const getDialogImagePreview = () => {
        if (!blockDialog.value.image) return '';
        if (String(blockDialog.value.image).startsWith('data:image')) return blockDialog.value.image;
        return `data:image/jpeg;base64,${blockDialog.value.image}`;
    };

    const normalizeLocalBlockOrder = () => {
        if (!article.value?.blocks?.length) return;
        const ordered = [...article.value.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        article.value.blocks = ordered.map((block, index) => ({ ...block, order: index }));
    };

    const resetPendingState = () => {
        pendingArticleChanged.value = false;
        pendingCreatedBlockIds.value = new Set();
        pendingDeletedBlockIds.value = new Set();
    };

    const addPendingCreatedBlockId = (id) => {
        const next = new Set(pendingCreatedBlockIds.value);
        next.add(id);
        pendingCreatedBlockIds.value = next;
    };

    const removePendingCreatedBlockId = (id) => {
        const next = new Set(pendingCreatedBlockIds.value);
        next.delete(id);
        pendingCreatedBlockIds.value = next;
    };

    const addPendingDeletedBlockId = (id) => {
        const next = new Set(pendingDeletedBlockIds.value);
        next.add(id);
        pendingDeletedBlockIds.value = next;
    };

    const addPendingUpdatedBlockId = (id) => {
        const next = new Set(pendingUpdatedBlockIds.value);
        next.add(id);
        pendingUpdatedBlockIds.value = next;
    };

    const removePendingUpdatedBlockId = (id) => {
        const next = new Set(pendingUpdatedBlockIds.value);
        next.delete(id);
        pendingUpdatedBlockIds.value = next;
    };

    const fetchArticle = async (id) => {
        if (!id) return;
        loading.value = true;
        error.value = '';
        try {
            const response = await axiosInstance.get(`/api/faq/articles/${id}`);
            article.value = {
                ...response.data,
                blocks: Array.isArray(response.data.blocks) ? response.data.blocks : [],
            };
            resetPendingState();
        } catch (fetchError) {
            console.debug('Ошибка при загрузке статьи:', fetchError);
            error.value = 'Не удалось загрузить статью.';
        } finally {
            loading.value = false;
        }
    };

    const toggleHeaderMenu = (event) => {
        headerMenuRef.value?.toggle(event);
    };

    const openArticleEdit = () => {
        if (!article.value) return;
        // 1. Snapshot article metadata
        originalArticleSnapshot.value = {
            question: article.value.question || '',
            order: Number(article.value.order) ?? 0,
            // add groupId, etc. if they can be edited
        };

        // 2. Snapshot all blocks (deep enough for your use-case)
        originalBlocksById.value.clear();
        (article.value.blocks || []).forEach(block => {
            const copy = {
                id: block.id,
                order: Number(block.order) ?? 0,
                contentTypes: normalizeBlockType(block),
                text: block.text || '',
                image: block.image || '',     // base64 string
            };
            originalBlocksById.value.set(block.id, copy);
        });

        if (editMode.value) return;
        editMode.value = true;
        toast.add({ severity: 'info', summary: 'FAQ', detail: 'Режим редактирования включен. Сохранение по кнопке "Готово"', life: 2400 });
    };

    const openTitleEditDialog = () => {
        if (!article.value) return;
        articleDialog.value = {
            visible: true,
            question: article.value.question || '',
        };
    };

    const submitPendingChanges = async () => {
        if (!article.value?.id) return;

        if (!hasPendingChanges.value) {
            editMode.value = false;
            return;
        }
        actionLoading.value = true;
        try {
            await delay(SAVE_DELAY_MS);
            normalizeLocalBlockOrder();
            const orderedBlocks = [...sortedBlocks.value];
            const requests = [];

            // ─── Article change ───────────────────────────────────────
            if (pendingArticleChanged.value) {
                const orig = originalArticleSnapshot.value;
                const curr = {
                    question: article.value.question || '',
                    order: Number(article.value.order) ?? 0,
                };

                if (orig.question !== curr.question || orig.order !== curr.order) {
                    requests.push(axiosInstance.put(faqWriteEndpoint(`articles/${article.value.id}`), {
                        groupId: article.value.groupId,
                        authorId: article.value.authorId,
                        question: article.value.question || '',
                        order: typeof article.value.order === 'number' ? article.value.order : 0,
                    }));
                }
            }

            // ─── Deletions ────────────────────────────────────────────
            pendingDeletedBlockIds.value.forEach((blockId) => {
                requests.push(axiosInstance.delete(faqWriteEndpoint(`article-blocks/${blockId}`), {
                    params: { articleId: article.value.id },
                }));
            });

            // ─── Creates + Updates ─────────────────────────────────────
            orderedBlocks.forEach((block, targetIndex) => {
                const isText = normalizeBlockType(block) === 'Text';
                const payloadBase = {
                    articleId: article.value.id,
                    image: isText ? '' : (block.image || ''),
                    text: isText ? (block.text || '') : '',
                    order: targetIndex,
                };

                if (pendingCreatedBlockIds.value.has(block.id)) {
                    requests.push(axiosInstance.post(faqWriteEndpoint('addarticleblock'), {
                        ...payloadBase,
                        type: isText ? 'Text' : 'Image',
                    }));
                    return;
                }

                if (pendingDeletedBlockIds.value.has(block.id)) return;

                // Existing block → compare with original
                const original = originalBlocksById.value.get(block.id);
                if (!original) {
                    // defensive — block appeared from nowhere → treat as update
                    requests.push(createPutRequest(block.id, payloadBase, isText));
                    return;
                }

                const currentOrder = targetIndex;
                const currentType  = isText ? 'Text' : 'Image';
                const currentText  = isText ? (block.text || '') : '';
                const currentImage = isText ? '' : (block.image || '');

                const changed =
                    original.order !== currentOrder ||
                    original.contentTypes !== currentType ||
                    original.text !== currentText ||
                    original.image !== currentImage;

                if (changed) {
                    requests.push(createPutRequest(block.id, payloadBase, isText));
                }
            });

            if (requests.length > 0) {
                await Promise.all(requests);
            }
            await fetchArticle(article.value.id);
            editMode.value = false;
            toast.add({ severity: 'success', summary: 'FAQ', detail: 'Изменения сохранены', life: 2200 });
        } catch (submitError) {
            console.debug('Ошибка при сохранении изменений статьи:', submitError);
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не удалось сохранить изменения', life: 2800 });
        } finally {
            actionLoading.value = false;
        }
    };

    function createPutRequest(id, payloadBase, isText) {
        return axiosInstance.put(
            faqWriteEndpoint(`article-blocks/${id}`),
            {
                ...payloadBase,
                contentTypes: isText ? 'Text' : 'Image',
            },
            {
                params: { articleId: article.value.id }
            }
        );
    }

    const exitEditMode = () => {
        if (!article.value?.id) {
            editMode.value = false;
            return;
        }
        if (!hasPendingChanges.value) {
            editMode.value = false;
            return;
        }
        submitPendingChanges();
    };

    const submitArticleUpdate = async () => {
        if (!article.value?.id) return;
        article.value.question = articleDialog.value.question;
        pendingArticleChanged.value = true;
        articleDialog.value.visible = false;
    };

    const deleteArticle = async () => {
        if (!article.value?.id) return;
        actionLoading.value = true;
        try {
            await axiosInstance.delete(faqWriteEndpoint(`articles/${article.value.id}`));
            toast.add({ severity: 'success', summary: 'FAQ', detail: 'Статья удалена', life: 2200 });
            deleteArticleDialog.value = false;
            router.push('/faq');
        } catch (deleteError) {
            console.debug('Ошибка при удалении статьи:', deleteError);
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не удалось удалить статью', life: 2600 });
        } finally {
            actionLoading.value = false;
        }
    };

    const openCreateBlockDialog = () => {
        if (!article.value?.id) return;
        const nextOrder = sortedBlocks.value.reduce((max, block) => {
            const order = Number(block?.order);
            if (!Number.isFinite(order)) return max;
            return Math.max(max, order);
        }, -1) + 1;

        blockDialog.value = {
            visible: true,
            mode: 'create',
            blockId: '',
            contentType: 'Text',
            text: '',
            image: '',
            order: nextOrder,
        };
    };

    const openEditBlockDialog = (block) => {
        blockDialog.value = {
            visible: true,
            mode: 'edit',
            blockId: block.id,
            contentType: normalizeBlockType(block),
            text: block.text || '',
            image: block.image || '',
            order: typeof block.order === 'number' ? block.order : 0,
        };
    };

    const submitBlockDialog = async () => {
        if (!article.value?.id) return;

        const isText = blockDialog.value.contentType === 'Text';
        if (isText && !blockDialog.value.text?.trim()) {
            toast.add({ severity: 'warn', summary: 'FAQ', detail: 'Введите текст блока', life: 2200 });
            return;
        }
        if (!isText && !blockDialog.value.image) {
            toast.add({ severity: 'warn', summary: 'FAQ', detail: 'Выберите изображение', life: 2200 });
            return;
        }

        try {
            if (!Array.isArray(article.value.blocks)) article.value.blocks = [];

            if (blockDialog.value.mode === 'create') {
                const tempId = createTempBlockId();
                article.value.blocks.push({
                    id: tempId,
                    articleId: article.value.id,
                    image: isText ? '' : blockDialog.value.image,
                    text: isText ? blockDialog.value.text : '',
                    order: blockDialog.value.order,
                    contentTypes: isText ? 'Text' : 'Image',
                });
                addPendingCreatedBlockId(tempId);
            } else {
                article.value.blocks = article.value.blocks.map((block) => 
                    block.id === blockDialog.value.blockId
                        ? {
                            ...block,
                            image: isText ? '' : blockDialog.value.image,
                            text: isText ? blockDialog.value.text : '',
                            contentTypes: isText ? 'Text' : 'Image',
                        }
                        : block
                );
                if (!isTempBlockId(blockDialog.value.blockId)) {
                    addPendingUpdatedBlockId(blockDialog.value.blockId);
                }
            }
            normalizeLocalBlockOrder();
            blockDialog.value.visible = false;
        } catch (blockError) {
            console.debug('Ошибка при локальном сохранении блока:', blockError);
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не удалось применить изменение блока', life: 2600 });
        } finally {
            actionLoading.value = false;
        }
    };

    const confirmDeleteBlock = (block) => {
        deleteBlockDialog.value = {
            visible: true,
            blockId: block.id,
        };
    };

    const deleteBlock = async () => {
        if (!deleteBlockDialog.value.blockId) return;
        try {
            const blockId = deleteBlockDialog.value.blockId;
            if (!Array.isArray(article.value?.blocks)) return;
            article.value.blocks = article.value.blocks.filter((block) => block.id !== blockId);
            if (isTempBlockId(blockId)) {
                removePendingCreatedBlockId(blockId);
            } else {
                addPendingDeletedBlockId(blockId);
            }
            normalizeLocalBlockOrder();
            deleteBlockDialog.value.visible = false;
        } catch (deleteError) {
            console.debug('Ошибка при локальном удалении блока:', deleteError);
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не удалось удалить блок локально', life: 2600 });
        }
    };

    const onBlockDragStart = (index) => {
        dragFromIndex.value = index;
    };

    const onBlockDragOver = (index) => {
        dragOverIndex.value = index;
    };

    const onBlockDragLeave = () => {
        dragOverIndex.value = -1;
    };

    const onBlockDragEnd = () => {
        dragFromIndex.value = -1;
        dragOverIndex.value = -1;
    };

    const onBlockDrop = async (index) => {
        if (!editMode.value || dragFromIndex.value < 0 || !article.value?.blocks?.length) return;
        const ordered = [...sortedBlocks.value];
        const [moved] = ordered.splice(dragFromIndex.value, 1);
        ordered.splice(index, 0, moved);

        article.value.blocks = ordered.map((block, idx) => ({ ...block, order: idx }));
        onBlockDragEnd();
    };

    const openDialogImagePicker = () => {
        dialogImageInputRef.value?.click();
    };

    const applyDialogImageFile = async (file) => {
        if (!file) return;
        blockDialog.value.image = await fileToBase64Data(file);
        blockDialog.value.contentType = 'Image';
    };

    const onDialogImageFileChange = async (event) => {
        const [file] = event.target.files || [];
        await applyDialogImageFile(file);
        event.target.value = '';
    };

    const onDialogImageDragOver = () => {
        isDialogDragOver.value = true;
    };

    const onDialogImageDragLeave = () => {
        isDialogDragOver.value = false;
    };

    const onDialogImageDrop = async (event) => {
        isDialogDragOver.value = false;
        const [file] = event.dataTransfer?.files || [];
        await applyDialogImageFile(file);
    };

    const goBack = () => {
        router.back();
    };

    onMounted(() => fetchArticle(route.params.id));
    watch(
        () => route.params.id,
        (nextId) => {
            editMode.value = false;
            fetchArticle(nextId);
        }
    );

    return {
        formatDate,
        article,
        loading,
        error,
        actionLoading,
        editMode,
        canEdit,
        headerMenuRef,
        dialogImageInputRef,
        isDialogDragOver,
        dragOverIndex,
        articleDialog,
        deleteArticleDialog,
        blockDialog,
        deleteBlockDialog,
        contentTypeOptions,
        sortedBlocks,
        headerMenuItems,
        getBlockImageSrc,
        getDialogImagePreview,
        toggleHeaderMenu,
        openTitleEditDialog,
        exitEditMode,
        submitArticleUpdate,
        deleteArticle,
        openEditBlockDialog,
        confirmDeleteBlock,
        openCreateBlockDialog,
        submitBlockDialog,
        deleteBlock,
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
        goBack,
    };
};
