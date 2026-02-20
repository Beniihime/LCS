import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/utils/axios.js';

const fileToBase64Data = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export const useFaqArticleCreatePage = () => {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const question = ref('');
    const actionLoading = ref(false);
    const dragFromIndex = ref(-1);
    const dragOverIndex = ref(-1);
    const dialogImageInputRef = ref(null);
    const isDialogDragOver = ref(false);

    const groupId = computed(() => String(route.query.groupId || ''));
    const groupTitle = computed(() => String(route.query.groupTitle || ''));

    const blocks = ref([]);

    const blockDialog = ref({
        visible: false,
        mode: 'create',
        blockId: '',
        contentType: 'Text',
        text: '',
        image: '',
    });

    const contentTypeOptions = [
        { label: 'Текст', value: 'Text' },
        { label: 'Изображение', value: 'Image' },
    ];

    const goBack = () => {
        router.back();
    };

    const nextOrder = () => {
        const maxOrder = blocks.value.reduce((max, block) => {
            const order = Number(block?.order);
            if (!Number.isFinite(order)) return max;
            return Math.max(max, order);
        }, -1);
        return maxOrder + 1;
    };

    const openCreateBlockDialog = () => {
        blockDialog.value = {
            visible: true,
            mode: 'create',
            blockId: '',
            contentType: 'Text',
            text: '',
            image: '',
        };
    };

    const openEditBlockDialog = (block) => {
        blockDialog.value = {
            visible: true,
            mode: 'edit',
            blockId: block.localId,
            contentType: block.type || 'Text',
            text: block.text || '',
            image: block.image || '',
        };
    };

    const saveBlockDialog = () => {
        const isText = blockDialog.value.contentType === 'Text';
        const text = (blockDialog.value.text || '').trim();
        const image = (blockDialog.value.image || '').trim();

        if (isText && !text) {
            toast.add({ severity: 'warn', summary: 'FAQ', detail: 'Введите текст блока', life: 2200 });
            return;
        }
        if (!isText && !image) {
            toast.add({ severity: 'warn', summary: 'FAQ', detail: 'Выберите изображение', life: 2200 });
            return;
        }

        if (blockDialog.value.mode === 'create') {
            blocks.value.push({
                localId: crypto.randomUUID(),
                type: isText ? 'Text' : 'Image',
                text: isText ? text : '',
                image: isText ? '' : image,
                order: nextOrder(),
            });
        } else {
            blocks.value = blocks.value.map((item) => {
                if (item.localId !== blockDialog.value.blockId) return item;
                return {
                    ...item,
                    type: isText ? 'Text' : 'Image',
                    text: isText ? text : '',
                    image: isText ? '' : image,
                };
            });
        }
        blockDialog.value.visible = false;
    };

    const removeBlock = (localId) => {
        blocks.value = blocks.value
            .filter((item) => item.localId !== localId)
            .map((item, idx) => ({ ...item, order: idx }));
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

    const onBlockDrop = (index) => {
        if (dragFromIndex.value < 0) return;
        const list = [...blocks.value];
        const [moved] = list.splice(dragFromIndex.value, 1);
        list.splice(index, 0, moved);
        blocks.value = list.map((item, idx) => ({ ...item, order: idx }));
        onBlockDragEnd();
    };

    const applyDialogImageFile = async (file) => {
        if (!file) return;
        if (!file.type?.startsWith('image/')) return;
        blockDialog.value.image = await fileToBase64Data(file);
        blockDialog.value.contentType = 'Image';
    };

    const openDialogImagePicker = () => {
        dialogImageInputRef.value?.click();
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

    const getBlockImageSrc = (imageRaw) => {
        if (!imageRaw) return '';
        if (String(imageRaw).startsWith('data:image')) return imageRaw;
        return `data:image/jpeg;base64,${imageRaw}`;
    };

    const createArticle = async () => {
        if (!groupId.value) {
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не выбрана группа для статьи', life: 2500 });
            return;
        }
        if (!question.value.trim()) {
            toast.add({ severity: 'warn', summary: 'FAQ', detail: 'Введите заголовок статьи', life: 2200 });
            return;
        }

        actionLoading.value = true;
        try {
            const payload = {
                groupId: groupId.value,
                question: question.value.trim(),
                order: 1,
                blocks: blocks.value.map((block, idx) => ({
                    image: block.type === 'Image' ? (block.image || '') : '',
                    text: block.type === 'Text' ? (block.text || '') : '',
                    order: idx,
                    type: block.type || 'None',
                })),
            };
            const response = await axiosInstance.post('/api/faq/addarticle', payload);
            toast.add({ severity: 'success', summary: 'FAQ', detail: 'Статья создана', life: 2200 });
            router.push(`/faq/articles/${response.data.id}`);
        } catch (createError) {
            console.debug('Ошибка при создании статьи:', createError);
            toast.add({ severity: 'error', summary: 'FAQ', detail: 'Не удалось создать статью', life: 2600 });
        } finally {
            actionLoading.value = false;
        }
    };

    return {
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
    };
};
