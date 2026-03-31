<template>
    <div class="faq-row-wrap" :class="item.type === 'group' ? 'group-wrap' : 'article-wrap'">
        <div
            :id="`faq-node-${item.type}-${item.id}`"
            tabindex="-1"
            class="faq-row"
            :class="[
                item.type === 'group' ? 'is-group' : 'is-article',
                {
                    'has-actions': canManageItem,
                    'is-focused-from-search': highlightedNodeKey === `${item.type}-${item.id}`,
                },
            ]"
            @click="onRowClick"
        >
            <div class="faq-row-left">
                <i
                    v-if="item.type === 'group'"
                    :class="['pi', item.expanded ? 'pi-chevron-down' : 'pi-chevron-right', 'faq-arrow']"
                ></i>
                <i v-else class="pi pi-question-circle faq-dot"></i>
                <span class="faq-row-title">{{ item.title }}</span>
                <i
                    v-if="canManageItem"
                    :class="['pi', item.isVisible ? 'pi-eye' : 'pi-eye-slash', 'faq-visibility-icon', { 'is-hidden': !item.isVisible }]"
                    :title="item.isVisible ? 'Видимо' : 'Скрыто'"
                    aria-hidden="true"
                ></i>
            </div>
            <div class="faq-row-right">
                <Button
                    v-if="canManageItem"
                    class="group-actions-btn"
                    type="button"
                    icon="pi pi-ellipsis-h"
                    @click.stop="toggleMenu"
                    aria-haspopup="true"
                    :aria-controls="`group-actions-${item.id}`"
                    severity="secondary"
                    text
                />
                <Menu
                    v-if="canManageItem"
                    ref="menuRef"
                    :model="menuItems"
                    :popup="true"
                    :id="`group-actions-${item.id}`"
                />
                <Tag rounded v-if="item.type === 'group'" severity="info">
                    {{ loadingGroupId === item.id ? 'Загрузка...' : 'Группа' }}
                </Tag>
                <Tag rounded severity="success" v-else>Статья</Tag>
            </div>
        </div>

        <Transition name="content-fade" mode="out-in">
            <div key="faq-node-children" v-if="item.type === 'group' && item.expanded && item.children?.length" class="faq-children">
                <FaqNode
                    v-for="child in item.children"
                    :key="child.key"
                    :item="child"
                    :loading-group-id="loadingGroupId"
                    :current-user-id="currentUserId"
                    :can-manage-any-faq="canManageAnyFaq"
                    :highlighted-node-key="highlightedNodeKey"
                    @toggle-group="$emit('toggle-group', $event)"
                    @open-article="$emit('open-article', $event)"
                    @group-action="$emit('group-action', $event)"
                />
            </div>
            <div key="faq-node-skeleton" v-else-if="item.type === 'group' && item.expanded && loadingGroupId === item.id" class="faq-children">
                <div class="faq-child-skeleton" v-for="idx in 3" :key="idx">
                    <Skeleton width="0.9rem" height="0.9rem" borderRadius="4px" />
                    <Skeleton width="58%" height="3.25rem" />
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';

defineOptions({ name: 'FaqNode' });

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    loadingGroupId: {
        type: String,
        default: '',
    },
    currentUserId: {
        type: String,
        default: '',
    },
    canManageAnyFaq: {
        type: Boolean,
        default: false,
    },
    highlightedNodeKey: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['toggle-group', 'open-article', 'group-action']);
const menuRef = ref(null);

const isAuthor = computed(() => {
    return String(props.item.authorId || '') === String(props.currentUserId || '');
});
const canManageItem = computed(() => props.canManageAnyFaq || isAuthor.value);

const menuItems = computed(() => ([
    {
        items: [
            {
                label: 'Создать подгруппу',
                icon: 'pi pi-folder-plus',
                visible: props.item.type === 'group',
                command: () => emit('group-action', { action: 'create-subgroup', group: props.item }),
            },
            {
                label: 'Создать статью',
                icon: 'pi pi-folder-plus',
                visible: props.item.type === 'group',
                command: () => emit('group-action', { action: 'create-article', group: props.item }),
            },
            {
                label: props.item.isVisible ? 'Скрыть' : 'Сделать видимым',
                icon: props.item.isVisible ? 'pi pi-eye-slash' : 'pi pi-eye',
                command: () => emit('group-action', {
                    action: props.item.type === 'group' ? 'toggle-group-visibility' : 'toggle-article-visibility',
                    group: props.item,
                }),
            },
            {
                label: 'Изменить группу',
                icon: 'pi pi-pen-to-square',
                visible: props.item.type === 'group',
                command: () => emit('group-action', { action: 'edit-group', group: props.item }),
            },
            {
                label: 'Удалить группу',
                icon: 'pi pi-trash',
                class: 'faq-danger-item',
                visible: props.item.type === 'group',
                command: () => emit('group-action', { action: 'delete-group', group: props.item }),
            },
        ],
    },
]));

const toggleMenu = (event) => {
    menuRef.value?.toggle(event);
};

const onRowClick = () => {
    if (props.item.type === 'group') {
        emit('toggle-group', props.item.id);
        return;
    }

    emit('open-article', props.item.id);
};
</script>

<style scoped>
.faq-row-wrap {
    width: 100%;
    animation: faqFadeIn 0.28s ease both;
}

.faq-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.82rem 1rem;
    border-radius: 16px;
    background: var(--p-grey-6);
    border: 1px solid var(--p-grey-4);
    transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.faq-row:hover{
    border-color: var(--p-blue-400);
    transform: translateY(-1px);
}

.faq-row:focus-visible {
    outline: none;
    border-color: var(--p-blue-500);
    box-shadow: 0 0 0 3px rgba(var(--p-blue-500-rgb), 0.16);
}

.faq-row.is-focused-from-search {
    border-color: var(--p-blue-500);
    box-shadow: 0 0 0 3px rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-blue-500) 7%, var(--p-grey-7));
}

.faq-row.is-group {
    font-weight: 600;
    color: var(--p-text-color);
    padding-left: 0.85rem;
}

.faq-row.is-group.has-actions::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 6px;
    background: linear-gradient(180deg, var(--p-blue-400) 0%, var(--p-blue-500) 100%);
    opacity: 0.95;
}

.faq-row.is-article {
    font-weight: 500;
    color: var(--p-text-color);
    background: var(--p-grey-7);
}

.faq-row-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
}

.faq-row-right {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
}

.group-actions-btn {
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 50%;
}

.faq-row-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.01em;
}

.faq-visibility-icon {
    font-size: 0.95rem;
    color: var(--p-blue-500);
    flex-shrink: 0;
}

.faq-visibility-icon.is-hidden {
    color: var(--p-orange-500);
}

.faq-arrow {
    font-size: 0.75rem;
    color: var(--p-text-color);
    width: 1rem;
    text-align: center;
}

.faq-dot {
    font-size: 0.85rem;
    color: var(--p-grey-1);
}

.faq-children {
    margin-top: 0.55rem;
    margin-left: 1.35rem;
    padding-left: 1rem;
    border-left: 1px dashed var(--p-grey-3);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.faq-child-skeleton {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 0.25rem;
}

@keyframes faqFadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 900px) {
    .faq-row {
        padding: 0.72rem 0.82rem;
    }
}
</style>
