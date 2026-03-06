import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/utils/axios.js';
import { FAQ_ADMIN_SEGMENT, USE_SU_FAQ_ENDPOINTS } from '@/mocks/config.js';

const ROOT_PARENT_ID = '00000000-0000-0000-0000-000000000000';

const normalizeGroups = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.groups)) return payload.groups;
    if (Array.isArray(payload.data?.groups)) return payload.data.groups;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
};

const normalizeArticles = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.articles)) return payload.articles;
    if (Array.isArray(payload.data?.articles)) return payload.data.articles;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
};

const mapGroupToItem = (group) => ({
    key: `group-${group.id}`,
    id: group.id,
    type: 'group',
    title: group.title || 'Без названия',
    parentId: group.parentId || null,
    authorId: group.authorId || null,
    order: typeof group.order === 'number' ? group.order : 0,
    expanded: false,
    loaded: false,
    children: [],
});

const mapArticleToItem = (article) => ({
    key: `article-${article.id}`,
    id: article.id,
    type: 'article',
    title: article.question || article.title || 'Без названия',
});

const updateGroupById = (list, groupId, updater) => {
    return list.map((item) => {
        if (item.type === 'group' && item.id === groupId) {
            return updater(item);
        }
        if (item.type === 'group' && item.children?.length) {
            return { ...item, children: updateGroupById(item.children, groupId, updater) };
        }
        return item;
    });
};

const removeGroupById = (list, groupId) => {
    return list
        .filter((item) => !(item.type === 'group' && item.id === groupId))
        .map((item) => {
            if (item.type === 'group' && item.children?.length) {
                return { ...item, children: removeGroupById(item.children, groupId) };
            }
            return item;
        });
};

const findGroupById = (list, groupId) => {
    for (const item of list) {
        if (item.type === 'group' && item.id === groupId) return item;
        if (item.type === 'group' && item.children?.length) {
            const found = findGroupById(item.children, groupId);
            if (found) return found;
        }
    }
    return null;
};

const faqWriteEndpoint = (path) => {
    if (!USE_SU_FAQ_ENDPOINTS) return `/api/faq/${path}`;
    return `/api/faq/${FAQ_ADMIN_SEGMENT}/${path}`;
};

export const useFaqGroupsPage = () => {
    const router = useRouter();
    const toast = useToast();

    const currentUserId = ref(localStorage.getItem('userId') || '');
    const items = ref([]);
    const loadingRoot = ref(false);
    const loadingGroupId = ref('');
    const error = ref('');
    const actionLoading = ref(false);

    const groupDialog = ref({
        visible: false,
        mode: 'create',
        groupId: '',
        parentId: '',
        authorId: '',
        title: '',
        order: 0,
    });

    const deleteDialog = ref({
        visible: false,
        group: null,
    });

    const getNextGroupOrder = (parentId) => {
        const getMaxOrder = (list) => list.reduce((max, item) => {
            const order = Number(item?.order);
            if (!Number.isFinite(order)) return max;
            return Math.max(max, order);
        }, -1);

        if (parentId === ROOT_PARENT_ID) {
            const rootGroups = items.value.filter((item) => item.type === 'group');
            return getMaxOrder(rootGroups) + 1;
        }

        const parent = findGroupById(items.value, parentId);
        if (!parent?.children?.length) return 0;

        const childGroups = parent.children.filter((item) => item.type === 'group');
        return getMaxOrder(childGroups) + 1;
    };

    const fetchSubGroups = async (groupId) => {
        return await axiosInstance.get('/api/faq/groups/', {
            params: { parentId: groupId },
        });
    };

    const loadGroupChildren = async (groupId) => {
        loadingGroupId.value = groupId;
        error.value = '';

        try {
            const [subGroupsResponse, articlesResponse] = await Promise.allSettled([
                fetchSubGroups(groupId),
                axiosInstance.get(`/api/faq/groups/${groupId}/articles`),
            ]);

            const subGroupsErrorStatus = subGroupsResponse.status === 'rejected'
                ? Number(subGroupsResponse.reason?.response?.status)
                : 0;
            const articlesErrorStatus = articlesResponse.status === 'rejected'
                ? Number(articlesResponse.reason?.response?.status)
                : 0;

            const canIgnoreSubGroupsError = subGroupsResponse.status === 'rejected' && [404, 204].includes(subGroupsErrorStatus);
            const canIgnoreArticlesError = articlesResponse.status === 'rejected' && [404, 204].includes(articlesErrorStatus);

            if ((subGroupsResponse.status === 'rejected' && !canIgnoreSubGroupsError)
                || (articlesResponse.status === 'rejected' && !canIgnoreArticlesError)) {
                throw subGroupsResponse.status === 'rejected' && !canIgnoreSubGroupsError
                    ? subGroupsResponse.reason
                    : articlesResponse.reason;
            }

            const subGroupsPayload = subGroupsResponse.status === 'fulfilled' ? subGroupsResponse.value.data : [];
            const articlesPayload = articlesResponse.status === 'fulfilled' ? articlesResponse.value.data : [];

            const subGroups = normalizeGroups(subGroupsPayload).map(mapGroupToItem);
            const articles = normalizeArticles(articlesPayload).map(mapArticleToItem);

            items.value = updateGroupById(items.value, groupId, (group) => ({
                ...group,
                loaded: true,
                expanded: true,
                children: [...subGroups, ...articles],
            }));
        } catch (fetchError) {
            console.debug('Ошибка при загрузке данных группы:', fetchError);
            error.value = 'Не удалось загрузить подгруппы или статьи.';
        } finally {
            loadingGroupId.value = '';
        }
    };

    const handleGroupToggle = async (groupId) => {
        const all = [];
        const flatten = (list) => {
            for (const item of list) {
                all.push(item);
                if (item.type === 'group' && item.children?.length) flatten(item.children);
            }
        };
        flatten(items.value);

        const target = all.find((item) => item.type === 'group' && item.id === groupId);
        if (!target) return;

        if (!target.loaded) {
            items.value = updateGroupById(items.value, groupId, (group) => ({
                ...group,
                expanded: true,
            }));
            await loadGroupChildren(groupId);
            return;
        }

        items.value = updateGroupById(items.value, groupId, (group) => ({
            ...group,
            expanded: !group.expanded,
        }));
    };

    const openArticle = (articleId) => {
        router.push(`/faq/articles/${articleId}`);
    };

    const openCreateSubgroupDialog = (group) => {
        groupDialog.value = {
            visible: true,
            mode: 'create',
            groupId: '',
            parentId: group.id,
            authorId: '',
            title: '',
            order: 0,
        };
    };

    const openCreateRootGroupDialog = () => {
        groupDialog.value = {
            visible: true,
            mode: 'create',
            groupId: '',
            parentId: ROOT_PARENT_ID,
            authorId: '',
            title: '',
            order: 0,
        };
    };

    const openEditGroupDialog = (group) => {
        const target = findGroupById(items.value, group.id);
        if (!target) return;
        groupDialog.value = {
            visible: true,
            mode: 'edit',
            groupId: target.id,
            parentId: target.parentId,
            authorId: target.authorId,
            title: target.title || '',
            order: typeof target.order === 'number' ? target.order : 0,
        };
    };

    const openDeleteDialog = (group) => {
        const target = findGroupById(items.value, group.id);
        if (!target) return;
        deleteDialog.value = {
            visible: true,
            group: target,
        };
    };

    const closeGroupDialog = () => {
        groupDialog.value.visible = false;
    };

    const closeDeleteDialog = () => {
        deleteDialog.value.visible = false;
        deleteDialog.value.group = null;
    };

    const submitGroupDialog = async () => {
        const payloadTitle = (groupDialog.value.title || '').trim();

        if (!payloadTitle) {
            error.value = 'Название группы не может быть пустым.';
            return;
        }

        actionLoading.value = true;
        error.value = '';
        try {
            if (groupDialog.value.mode === 'create') {
                if (groupDialog.value.parentId !== ROOT_PARENT_ID) {
                    const parent = findGroupById(items.value, groupDialog.value.parentId);
                    if (parent && !parent.loaded) {
                        await loadGroupChildren(groupDialog.value.parentId);
                    }
                }
                const payloadOrder = getNextGroupOrder(groupDialog.value.parentId);

                const payload = {
                    title: payloadTitle,
                    order: payloadOrder,
                };

                if (groupDialog.value.parentId !== ROOT_PARENT_ID) {
                    payload.parentId = groupDialog.value.parentId;
                }

                await axiosInstance.post('/api/faq/addgroup', payload);

                if (groupDialog.value.parentId === ROOT_PARENT_ID) {
                    await fetchRootGroups();
                } else {
                    items.value = updateGroupById(items.value, groupDialog.value.parentId, (target) => ({
                        ...target,
                        loaded: false,
                        expanded: true,
                    }));
                    await loadGroupChildren(groupDialog.value.parentId);
                }
            } else {
                const payloadOrder = Number.isFinite(Number(groupDialog.value.order)) ? Number(groupDialog.value.order) : 0;
                await axiosInstance.put(faqWriteEndpoint(`groups/${groupDialog.value.groupId}`), {
                    parentId: groupDialog.value.parentId,
                    authorId: groupDialog.value.authorId,
                    title: payloadTitle,
                    order: payloadOrder,
                });
                items.value = updateGroupById(items.value, groupDialog.value.groupId, (item) => ({
                    ...item,
                    title: payloadTitle,
                    order: payloadOrder,
                }));
            }
            closeGroupDialog();
        } catch (actionError) {
            console.debug('Ошибка при сохранении группы:', actionError);
            error.value = groupDialog.value.mode === 'create' ? 'Не удалось создать подгруппу.' : 'Не удалось обновить группу.';
        } finally {
            actionLoading.value = false;
        }
    };

    const confirmDeleteGroup = async () => {
        if (!deleteDialog.value.group?.id) return;
        actionLoading.value = true;
        error.value = '';
        try {
            await axiosInstance.delete(faqWriteEndpoint(`groups/${deleteDialog.value.group.id}`));
            items.value = removeGroupById(items.value, deleteDialog.value.group.id);
            closeDeleteDialog();
        } catch (actionError) {
            console.debug('Ошибка при удалении группы:', actionError);
            error.value = 'Не удалось удалить группу.';
        } finally {
            actionLoading.value = false;
        }
    };

    const handleGroupAction = async ({ action, group }) => {
        if (!group?.id) return;

        if (action === 'create-article') {
            router.push({
                path: '/faq/articles/create',
                query: {
                    groupId: group.id,
                    groupTitle: group.title || '',
                },
            });
            return;
        }

        if (action === 'create-subgroup') {
            openCreateSubgroupDialog(group);
            return;
        }

        if (action === 'edit-group') {
            openEditGroupDialog(group);
            return;
        }

        if (action === 'delete-group') {
            openDeleteDialog(group);
        }
    };

    const fetchRootGroups = async () => {
        loadingRoot.value = true;
        error.value = '';
        try {
            const response = await axiosInstance.get('/api/faq/groups');
            items.value = normalizeGroups(response.data).map(mapGroupToItem);
        } catch (fetchError) {
            console.debug('Ошибка при загрузке корневых групп:', fetchError);
            error.value = 'Не удалось загрузить группы.';
        } finally {
            loadingRoot.value = false;
        }
    };

    fetchRootGroups();

    watch(error, (message) => {
        if (!message) return;
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: message,
            life: 3500,
        });
        error.value = '';
    });

    return {
        ROOT_PARENT_ID,
        currentUserId,
        items,
        loadingRoot,
        loadingGroupId,
        error,
        actionLoading,
        groupDialog,
        deleteDialog,
        fetchRootGroups,
        openCreateRootGroupDialog,
        handleGroupToggle,
        openArticle,
        handleGroupAction,
        closeGroupDialog,
        submitGroupDialog,
        closeDeleteDialog,
        confirmDeleteGroup,
    };
};
