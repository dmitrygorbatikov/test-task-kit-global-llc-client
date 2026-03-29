import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type UIEvent,
} from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
} from '@hello-pangea/dnd';
import { Link, useParams } from 'react-router-dom';
import {
    type Column,
    type ProjectMember,
    type ProjectRole,
    type Task,
    type TaskStatus,
    type TaskComment,
    type TaskLocation,
    useProjectStore,
} from '../../shared/stores/projectStore.ts';
import * as React from "react";

type TaskLocationForm = {
    lat: string;
    lng: string;
};

type NewTaskForm = {
    title: string;
    description: string;
    labels: string[];
    assigneeIds: string[];
    deadline: string;
    columnId: string;
    location: TaskLocationForm;
};

type EditTaskForm = {
    _id: string;
    columnId: string;
    title: string;
    description: string;
    labels: string[];
    assigneeIds: string[];
    deadline: string;
    parentTaskId: string | null;
    location: TaskLocationForm;
    removeLocation?: boolean;
};

type StatusTab = 'active' | 'archived' | 'done';

const STATUS_TABS: Array<{ key: StatusTab; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'archived', label: 'Archived' },
    { key: 'done', label: 'Done' },
];

const TAB_TO_STATUSES: Record<StatusTab, TaskStatus[]> = {
    active: ['active'],
    archived: ['archived'],
    done: ['done'],
};

const emptyLocation = (): TaskLocationForm => ({
    lat: '',
    lng: '',
});

const emptyNewTask = (): NewTaskForm => ({
    title: '',
    description: '',
    labels: [],
    assigneeIds: [],
    deadline: '',
    columnId: '',
    location: emptyLocation(),
});

const emptyEditTask = (): EditTaskForm => ({
    _id: '',
    columnId: '',
    title: '',
    description: '',
    labels: [],
    assigneeIds: [],
    deadline: '',
    parentTaskId: null,
    location: emptyLocation(),
    removeLocation: false,
});

export default function ProjectItemPage() {
    const {
        getProject,
        updateProject,
        addColumn,
        updateColumn,
        deleteColumn,
        addTask,
        updateTask,
        updateTaskStatus,
        getMembers,
        removeMember,
        loadAssigneeOptions,
        resetAssigneeOptions,
        setAssigneeSearch,
        loadColumnTasks,
        resetColumnTasks,

        addMember,
        searchUsersForAdd,
        resetSearchUsersForAdd,
        updateMemberRole,

        project,
        projectColumns,
        projectLoading,
        projectError,
        members,
        membersMeta,
        membersLoading,
        membersError,
        assigneeOptions,
        assigneeOptionsLoading,
        assigneeOptionsLoadingMore,
        assigneeOptionsError,
        assigneeOptionsMeta,
        assigneeSearch,
        columnTasks,

        memberSearchUsers,
        memberSearchUsersLoading,
        memberSearchUsersError,
        memberSearchUsersMeta,

        getTaskComments,
        createTaskComment,
        resetTaskComments,
        taskComments,
    } = useProjectStore();

    const { projectId } = useParams<{ projectId: string }>();

    const [localColumns, setLocalColumns] = useState<Column[]>([]);
    const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('active');

    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const [memberSearch, setMemberSearch] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState<ProjectRole | ''>('');

    const [submittingTask, setSubmittingTask] = useState(false);
    const [savingTask, setSavingTask] = useState(false);
    const [submittingColumn, setSubmittingColumn] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);
    const [changingTaskStatusId, setChangingTaskStatusId] = useState<string | null>(null);
    const [savingProject, setSavingProject] = useState(false);
    const [savingColumnId, setSavingColumnId] = useState<string | null>(null);

    const [newTask, setNewTask] = useState<NewTaskForm>(emptyNewTask());
    const [editTask, setEditTask] = useState<EditTaskForm>(emptyEditTask());

    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const [isEditAssigneeDropdownOpen, setIsEditAssigneeDropdownOpen] = useState(false);

    const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
    const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);

    const [isEditingProjectTitle, setIsEditingProjectTitle] = useState(false);
    const [isEditingProjectDescription, setIsEditingProjectDescription] = useState(false);
    const [projectTitleDraft, setProjectTitleDraft] = useState('');
    const [projectDescriptionDraft, setProjectDescriptionDraft] = useState('');
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [columnTitleDraft, setColumnTitleDraft] = useState('');
    const [addUserSearch, setAddUserSearch] = useState('');
    const [addUserRole, setAddUserRole] = useState<ProjectRole>('member');
    const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState<string[]>([]);
    const [addingMembersLoading, setAddingMembersLoading] = useState(false);
    const [updatingMemberRoleId, setUpdatingMemberRoleId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);

    const assigneeListRef = useRef<HTMLDivElement | null>(null);
    const editAssigneeListRef = useRef<HTMLDivElement | null>(null);
    const commentsListRef = useRef<HTMLDivElement | null>(null);

    const currentTaskCommentsState = editTask._id
        ? taskComments[editTask._id]
        : null;

    const currentTaskComments = currentTaskCommentsState?.items ?? [];

    const visibleMembers = useMemo(() => members.slice(0, 4), [members]);

    const activeStatuses = useMemo(
        () => TAB_TO_STATUSES[activeStatusTab],
        [activeStatusTab],
    );

    const backlogColumn = useMemo(
        () => projectColumns.find((column) => column.title.toLowerCase() === 'backlog'),
        [projectColumns],
    );

    const isOwner = project?.role === 'owner';
    const isAdmin = project?.role === 'admin';
    const canManageMembers = isOwner || isAdmin;
    const canManageProject = isOwner || isAdmin;

    const handleToggleUserToAdd = (userId: string) => {
        setSelectedUserIdsToAdd((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const initials = (name?: string, email?: string) => {
        const source = name?.trim() || email?.trim() || '?';
        const parts = source.split(' ').filter(Boolean);

        if (parts.length >= 2) {
            return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
        }

        return source.slice(0, 2).toUpperCase();
    };

    const formatRole = (role?: string) => {
        if (!role) return 'Member';
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formatDeadline = (value?: string | null) => {
        if (!value) return '';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString();
    };

    const normalizeDateForInput = (value?: string | null) => {
        if (!value) return '';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return date.toISOString().slice(0, 10);
    };

    const resetTaskForm = (columnId?: string) => {
        setNewTask({
            title: '',
            description: '',
            labels: [],
            assigneeIds: [],
            deadline: '',
            columnId: columnId ?? projectColumns[0]?._id ?? '',
            location: emptyLocation(),
        });
    };

    const selectedCreateAssignees = useMemo(() => {
        const map = new Map<string, ProjectMember>();

        members.forEach((member) => {
            if (newTask.assigneeIds.includes(member.userId)) {
                map.set(member.userId, member);
            }
        });

        assigneeOptions.forEach((member) => {
            if (newTask.assigneeIds.includes(member.userId)) {
                map.set(member.userId, member);
            }
        });

        return Array.from(map.values());
    }, [members, assigneeOptions, newTask.assigneeIds]);

    const selectedEditAssignees = useMemo(() => {
        const map = new Map<string, ProjectMember>();

        members.forEach((member) => {
            if (editTask.assigneeIds.includes(member.userId)) {
                map.set(member.userId, member);
            }
        });

        assigneeOptions.forEach((member) => {
            if (editTask.assigneeIds.includes(member.userId)) {
                map.set(member.userId, member);
            }
        });

        return Array.from(map.values());
    }, [members, assigneeOptions, editTask.assigneeIds]);

    const loadProjectPageData = async () => {
        if (!projectId) return;

        await Promise.all([
            getProject(projectId),
            getMembers(projectId, {
                page: 1,
                perPage: 20,
            }),
        ]);
    };

    const reloadAllColumnsForCurrentTab = async () => {
        if (!projectId || projectColumns.length === 0) return;

        await Promise.all(
            projectColumns.map((column) =>
                loadColumnTasks(projectId, column._id, {
                    limit: 20,
                    reset: true,
                    statuses: activeStatuses,
                }),
            ),
        );
    };

    const startProjectTitleEdit = () => {
        setProjectTitleDraft(project?.title ?? '');
        setIsEditingProjectTitle(true);
    };

    const startProjectDescriptionEdit = () => {
        setProjectDescriptionDraft(project?.description ?? '');
        setIsEditingProjectDescription(true);
    };

    const cancelProjectTitleEdit = () => {
        setIsEditingProjectTitle(false);
        setProjectTitleDraft(project?.title ?? '');
    };

    const cancelProjectDescriptionEdit = () => {
        setIsEditingProjectDescription(false);
        setProjectDescriptionDraft(project?.description ?? '');
    };

    const handleSaveProjectTitle = async () => {
        if (!projectId || !project) return;

        const nextTitle = projectTitleDraft.trim();

        if (!nextTitle || nextTitle === project.title) {
            cancelProjectTitleEdit();
            return;
        }

        try {
            setSavingProject(true);
            await updateProject(projectId, { title: nextTitle });
            setIsEditingProjectTitle(false);
        } catch (err) {
            console.error('Failed to update project title:', err);
        } finally {
            setSavingProject(false);
        }
    };

    const handleSaveProjectDescription = async () => {
        if (!projectId || !project) return;

        const nextDescription = projectDescriptionDraft.trim();

        if (nextDescription === (project.description ?? '')) {
            cancelProjectDescriptionEdit();
            return;
        }

        try {
            setSavingProject(true);
            await updateProject(projectId, { description: nextDescription });
            setIsEditingProjectDescription(false);
        } catch (err) {
            console.error('Failed to update project description:', err);
        } finally {
            setSavingProject(false);
        }
    };

    const startColumnEdit = (column: Column) => {
        setOpenColumnMenuId(null);
        setEditingColumnId(column._id);
        setColumnTitleDraft(column.title);
    };

    const cancelColumnEdit = () => {
        setEditingColumnId(null);
        setColumnTitleDraft('');
    };

    const handleSaveColumnTitle = async (column: Column) => {
        if (!projectId) return;

        const nextTitle = columnTitleDraft.trim();

        if (!nextTitle || nextTitle === column.title) {
            cancelColumnEdit();
            return;
        }

        try {
            setSavingColumnId(column._id);
            await updateColumn(projectId, column._id, { title: nextTitle });
            setEditingColumnId(null);
            setColumnTitleDraft('');
        } catch (err) {
            console.error('Failed to update column title:', err);
        } finally {
            setSavingColumnId(null);
        }
    };

    const handleInputHotkeys = (
        e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
        onSave: () => void,
        onCancel: () => void,
    ) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave();
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const openCreateTaskModal = async (columnId?: string) => {
        if (!projectId) return;

        resetTaskForm(columnId);
        setIsCreateTaskModalOpen(true);
        setIsAssigneeDropdownOpen(false);
        setAssigneeSearch('');

        try {
            await loadAssigneeOptions(projectId, {
                page: 1,
                perPage: 20,
                search: '',
                reset: true,
            });
        } catch (err) {
            console.error('Failed to load assignee options:', err);
        }
    };

    const closeCreateTaskModal = () => {
        setIsCreateTaskModalOpen(false);
        setIsAssigneeDropdownOpen(false);
        setAssigneeSearch('');
        resetAssigneeOptions();
        resetTaskForm();
    };

    const openEditTaskModal = async (task: Task, columnId: string) => {
        if (!projectId) return;

        setEditTask({
            _id: task._id,
            columnId,
            title: task.title ?? '',
            description: task.description ?? '',
            labels: task.labels ?? [],
            assigneeIds:
                task.assigneeIds ?? task.assignees?.map((item) => item._id) ?? [],
            deadline: normalizeDateForInput(task.deadline),
            parentTaskId: task.parentTaskId ?? null,
            location: {
                lat: task.location?.coordinates?.[1]?.toString() ?? '',
                lng: task.location?.coordinates?.[0]?.toString() ?? '',
            },
            removeLocation: false,
        });

        setNewComment('');
        setReplyToCommentId(null);
        setIsEditTaskModalOpen(true);
        setIsEditAssigneeDropdownOpen(false);
        setAssigneeSearch('');

        try {
            await getTaskComments(projectId, task._id, {
                page: 1,
                perPage: 20,
                reset: true,
            });
        } catch (err) {
            console.error('Failed to load task comments:', err);
        }
    };

    const buildTaskLocationPayload = (location: TaskLocationForm) => {
        const lat = Number(location.lat.trim());
        const lng = Number(location.lng.trim());

        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return null;
        }

        return {
            type: 'Point' as const,
            coordinates: [lng, lat] as [number, number],
        };
    };

    const formatTaskLocation = (task: Task) => {
        const lat = task.location?.coordinates?.[1];
        const lng = task.location?.coordinates?.[0];

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return '';
        }

        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    };

    const fillCurrentLocationForCreate = () => {
        if (!navigator.geolocation) {
            window.alert('Geolocation is not supported in this browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setNewTask((prev) => ({
                    ...prev,
                    location: {
                        lat: String(position.coords.latitude),
                        lng: String(position.coords.longitude),
                    },
                }));
            },
            (error) => {
                console.error('Failed to get current location:', error);
                window.alert('Failed to get current location');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

    const fillCurrentLocationForEdit = () => {
        if (!navigator.geolocation) {
            window.alert('Geolocation is not supported in this browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setEditTask((prev) => ({
                    ...prev,
                    removeLocation: false,
                    location: {
                        lat: String(position.coords.latitude),
                        lng: String(position.coords.longitude),
                    },
                }));
            },
            (error) => {
                console.error('Failed to get current location:', error);
                window.alert('Failed to get current location');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

    const closeEditTaskModal = () => {
        if (editTask._id) {
            resetTaskComments(editTask._id);
        }

        setIsEditTaskModalOpen(false);
        setIsEditAssigneeDropdownOpen(false);
        setAssigneeSearch('');
        setNewComment('');
        setReplyToCommentId(null);
        resetAssigneeOptions();
        setEditTask(emptyEditTask());
    };

    const handleCreateComment = async () => {
        if (!projectId || !editTask._id || !newComment.trim()) return;

        try {
            setSubmittingComment(true);

            await createTaskComment(projectId, editTask._id, {
                content: newComment.trim(),
                parentCommentId: replyToCommentId,
            });

            setNewComment('');
            setReplyToCommentId(null);
        } catch (err) {
            console.error('Failed to create comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const renderCommentsTree = (comments: TaskComment[], depth = 0): React.ReactNode => {
        return comments.map((comment) => (
            <div
                key={comment._id}
                className={`${depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''} mt-3`}
            >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-sm font-medium text-slate-800">
                            {comment.author?.fullName || comment.author?.email || 'Unknown user'}
                        </div>

                        <div className="text-xs text-slate-400">
                            {comment.createdAt
                                ? new Date(comment.createdAt).toLocaleString()
                                : ''}
                        </div>
                    </div>

                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                        {comment.content}
                    </div>

                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() =>
                                setReplyToCommentId((prev) =>
                                    prev === comment._id ? null : comment._id,
                                )
                            }
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            {replyToCommentId === comment._id ? 'Cancel reply' : 'Reply'}
                        </button>
                    </div>
                </div>

                {comment.replies?.length > 0 && (
                    <div className="mt-2">
                        {renderCommentsTree(comment.replies, depth + 1)}
                    </div>
                )}
            </div>
        ));
    };

    const toggleCreateAssignee = (userId: string) => {
        setNewTask((prev) => ({
            ...prev,
            assigneeIds: prev.assigneeIds.includes(userId)
                ? prev.assigneeIds.filter((id) => id !== userId)
                : [...prev.assigneeIds, userId],
        }));
    };

    const toggleEditAssignee = (userId: string) => {
        setEditTask((prev) => ({
            ...prev,
            assigneeIds: prev.assigneeIds.includes(userId)
                ? prev.assigneeIds.filter((id) => id !== userId)
                : [...prev.assigneeIds, userId],
        }));
    };

    const handleCreateTask = async () => {
        if (!projectId || !newTask.title.trim() || !newTask.columnId) return;

        try {
            setSubmittingTask(true);

            const locationPayload = buildTaskLocationPayload(newTask.location);

            await addTask(projectId, newTask.columnId, {
                title: newTask.title.trim(),
                description: newTask.description.trim() || undefined,
                labels: newTask.labels,
                assigneeIds: newTask.assigneeIds,
                deadline: newTask.deadline || undefined,
                parentTaskId: null,
                location: locationPayload ?? undefined,
            });

            await reloadAllColumnsForCurrentTab();
            closeCreateTaskModal();
        } catch (err) {
            console.error('Failed to create task:', err);
        } finally {
            setSubmittingTask(false);
        }
    };

    const handleSaveTask = async () => {
        if (!projectId || !editTask._id || !editTask.columnId || !editTask.title.trim()) {
            return;
        }

        try {
            setSavingTask(true);

            const locationPayload = buildTaskLocationPayload(editTask.location);

            await updateTask(projectId, editTask.columnId, editTask._id, {
                title: editTask.title.trim(),
                description: editTask.description.trim() || null,
                labels: editTask.labels,
                assigneeIds: editTask.assigneeIds,
                deadline: editTask.deadline || null,
                parentTaskId: editTask.parentTaskId ?? null,
                location: editTask.removeLocation ? undefined : locationPayload ?? undefined,
                removeLocation: editTask.removeLocation,
            });

            await reloadAllColumnsForCurrentTab();
            closeEditTaskModal();
        } catch (err) {
            console.error('Failed to update task:', err);
        } finally {
            setSavingTask(false);
        }
    };

    const handleArchiveTask = async (task: Task, columnId: string) => {
        if (!projectId) return;

        try {
            setChangingTaskStatusId(task._id);
            setOpenTaskMenuId(null);

            await updateTaskStatus(projectId, columnId, task._id, 'archived');
            await reloadAllColumnsForCurrentTab();

            if (editTask._id === task._id) {
                closeEditTaskModal();
            }
        } catch (err) {
            console.error('Failed to archive task:', err);
        } finally {
            setChangingTaskStatusId(null);
        }
    };

    const handleDoneTask = async (task: Task, columnId: string) => {
        if (!projectId) return;

        try {
            setChangingTaskStatusId(task._id);
            setOpenTaskMenuId(null);

            await updateTaskStatus(projectId, columnId, task._id, 'done');
            await reloadAllColumnsForCurrentTab();

            if (editTask._id === task._id) {
                closeEditTaskModal();
            }
        } catch (err) {
            console.error('Failed to mark task as done:', err);
        } finally {
            setChangingTaskStatusId(null);
        }
    };

    const handleRestoreTaskToActive = async (task: Task, columnId: string) => {
        if (!projectId) return;

        try {
            setChangingTaskStatusId(task._id);
            setOpenTaskMenuId(null);

            await updateTaskStatus(projectId, columnId, task._id, 'active');
            await reloadAllColumnsForCurrentTab();

            if (editTask._id === task._id) {
                closeEditTaskModal();
            }
        } catch (err) {
            console.error('Failed to restore task to active:', err);
        } finally {
            setChangingTaskStatusId(null);
        }
    };

    const handleCreateColumn = async () => {
        if (!projectId || !newColumnTitle.trim()) return;

        try {
            setSubmittingColumn(true);
            await addColumn(projectId, newColumnTitle.trim());
            await reloadAllColumnsForCurrentTab();
            setNewColumnTitle('');
            setIsAddingColumn(false);
        } catch (err) {
            console.error('Failed to create column:', err);
        } finally {
            setSubmittingColumn(false);
        }
    };

    const handleDeleteColumn = async (column: Column) => {
        if (!projectId) return;

        if (column.title.toLowerCase() === 'backlog' || backlogColumn?._id === column._id) {
            window.alert('Backlog колонку нельзя удалить');
            return;
        }

        const confirmed = window.confirm(
            `Удалить колонку "${column.title}"?\n\nВсе задачи из этой колонки будут перенесены в Backlog.`,
        );

        if (!confirmed) return;

        try {
            setDeletingColumnId(column._id);
            await deleteColumn(projectId, column._id);
            await reloadAllColumnsForCurrentTab();
        } catch (err) {
            console.error('Failed to delete column:', err);
        } finally {
            setDeletingColumnId(null);
        }
    };

    const handleOpenMembersModal = async () => {
        if (!projectId) return;

        setIsUsersModalOpen(true);
        setSelectedUserIdsToAdd([]);

        try {
            await Promise.all([
                getMembers(projectId, {
                    page: 1,
                    perPage: 20,
                    search: memberSearch.trim() || undefined,
                    role: memberRoleFilter || undefined,
                }),
                searchUsersForAdd(projectId, {
                    page: 1,
                    perPage: 10,
                    search: addUserSearch.trim() || undefined,
                }),
            ]);
        } catch (err) {
            console.error('Failed to load members modal data:', err);
        }
    };

    const handleApplyMembersFilter = async () => {
        if (!projectId) return;

        try {
            await getMembers(projectId, {
                page: 1,
                perPage: 20,
                search: memberSearch.trim() || undefined,
                role: memberRoleFilter || undefined,
            });
        } catch (err) {
            console.error('Failed to filter members:', err);
        }
    };

    const handleRemoveMember = async (member: ProjectMember) => {
        if (!projectId) return;

        const confirmed = window.confirm(
            `Удалить ${member.user?.fullName || member.user?.email || 'участника'} из проекта?`,
        );

        if (!confirmed) return;

        try {
            setRemovingMemberId(member.userId);
            await removeMember(projectId, member.userId);

            await Promise.all([
                getMembers(projectId, {
                    page: 1,
                    perPage: 20,
                    search: memberSearch.trim() || undefined,
                    role: memberRoleFilter || undefined,
                }),
                searchUsersForAdd(projectId, {
                    page: 1,
                    perPage: 10,
                    search: addUserSearch.trim() || undefined,
                }),
            ]);
        } catch (err) {
            console.error('Failed to remove member:', err);
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleToggleCreateAssigneeDropdown = async () => {
        if (!projectId) return;

        const nextOpen = !isAssigneeDropdownOpen;
        setIsAssigneeDropdownOpen(nextOpen);

        if (nextOpen && assigneeOptions.length === 0 && !assigneeOptionsLoading) {
            try {
                await loadAssigneeOptions(projectId, {
                    page: 1,
                    perPage: 20,
                    search: assigneeSearch,
                    reset: true,
                });
            } catch (err) {
                console.error('Failed to open assignee dropdown:', err);
            }
        }
    };

    const handleToggleEditAssigneeDropdown = async () => {
        if (!projectId) return;

        const nextOpen = !isEditAssigneeDropdownOpen;
        setIsEditAssigneeDropdownOpen(nextOpen);

        if (nextOpen && assigneeOptions.length === 0 && !assigneeOptionsLoading) {
            try {
                await loadAssigneeOptions(projectId, {
                    page: 1,
                    perPage: 20,
                    search: assigneeSearch,
                    reset: true,
                });
            } catch (err) {
                console.error('Failed to open edit assignee dropdown:', err);
            }
        }
    };

    const handleAssigneeSearchChange = (value: string) => {
        setAssigneeSearch(value);
    };

    const handleStatusTabChange = async (tab: StatusTab) => {
        if (!projectId) return;

        setActiveStatusTab(tab);
        setOpenColumnMenuId(null);
        setOpenTaskMenuId(null);
        setEditingColumnId(null);
        resetColumnTasks();

        if (projectColumns.length === 0) return;

        const statuses = TAB_TO_STATUSES[tab];

        try {
            await Promise.all(
                projectColumns.map((column) =>
                    loadColumnTasks(projectId, column._id, {
                        limit: 20,
                        reset: true,
                        statuses,
                    }),
                ),
            );
        } catch (err) {
            console.error('Failed to switch task status tab:', err);
        }
    };

    useEffect(() => {
        if (!projectId) return;

        const shouldLoad =
            (isCreateTaskModalOpen && isAssigneeDropdownOpen) ||
            (isEditTaskModalOpen && isEditAssigneeDropdownOpen);

        if (!shouldLoad) return;

        const timeout = setTimeout(() => {
            loadAssigneeOptions(projectId, {
                page: 1,
                perPage: 20,
                search: assigneeSearch,
                reset: true,
            }).catch((err) => {
                console.error('Failed to search assignees:', err);
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [
        assigneeSearch,
        projectId,
        loadAssigneeOptions,
        isCreateTaskModalOpen,
        isEditTaskModalOpen,
        isAssigneeDropdownOpen,
        isEditAssigneeDropdownOpen,
    ]);

    const handleCreateAssigneeScroll = async () => {
        const el = assigneeListRef.current;
        if (!el || !projectId) return;

        const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
        if (!isNearBottom) return;
        if (assigneeOptionsLoading || assigneeOptionsLoadingMore) return;

        const currentPage = assigneeOptionsMeta?.page ?? 1;
        const totalPages = assigneeOptionsMeta?.totalPages ?? 1;
        const perPage = assigneeOptionsMeta?.perPage ?? 20;

        if (currentPage >= totalPages) return;

        try {
            await loadAssigneeOptions(projectId, {
                page: currentPage + 1,
                perPage,
                search: assigneeSearch,
                reset: false,
            });
        } catch (err) {
            console.error('Failed to load more assignee options:', err);
        }
    };

    const handleEditAssigneeScroll = async () => {
        const el = editAssigneeListRef.current;
        if (!el || !projectId) return;

        const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
        if (!isNearBottom) return;
        if (assigneeOptionsLoading || assigneeOptionsLoadingMore) return;

        const currentPage = assigneeOptionsMeta?.page ?? 1;
        const totalPages = assigneeOptionsMeta?.totalPages ?? 1;
        const perPage = assigneeOptionsMeta?.perPage ?? 20;

        if (currentPage >= totalPages) return;

        try {
            await loadAssigneeOptions(projectId, {
                page: currentPage + 1,
                perPage,
                search: assigneeSearch,
                reset: false,
            });
        } catch (err) {
            console.error('Failed to load more edit assignee options:', err);
        }
    };

    const handleCommentsScroll = async () => {
        const el = commentsListRef.current;
        if (!el || !projectId || !editTask._id || !currentTaskCommentsState) return;

        const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;

        if (!isNearBottom) return;
        if (currentTaskCommentsState.loading || currentTaskCommentsState.loadingMore) return;

        const currentPage = currentTaskCommentsState.meta?.page ?? 1;
        const totalPages = currentTaskCommentsState.meta?.totalPages ?? 1;
        const perPage = currentTaskCommentsState.meta?.perPage ?? 20;

        if (currentPage >= totalPages) return;

        try {
            await getTaskComments(projectId, editTask._id, {
                page: currentPage + 1,
                perPage,
                reset: false,
            });
        } catch (err) {
            console.error('Failed to load more comments:', err);
        }
    };

    const handleColumnScroll = async (columnId: string, e: UIEvent<HTMLDivElement>) => {
        if (!projectId) return;

        const columnState = columnTasks[columnId];
        if (!columnState) return;

        const el = e.currentTarget;
        const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;

        if (!isNearBottom) return;
        if (columnState.loading || columnState.loadingMore) return;
        if (!columnState.meta?.hasMore) return;

        try {
            await loadColumnTasks(projectId, columnId, {
                limit: columnState.meta?.limit ?? 20,
                reset: false,
                statuses: activeStatuses,
            });
        } catch (err) {
            console.error(`Failed to load more tasks for column ${columnId}:`, err);
        }
    };

    const handleAddMembers = async () => {
        if (!projectId || selectedUserIdsToAdd.length === 0) return;

        try {
            setAddingMembersLoading(true);

            await addMember(projectId, {
                userIds: selectedUserIdsToAdd,
                role: addUserRole,
            });

            setSelectedUserIdsToAdd([]);
            setAddUserSearch('');

            await Promise.all([
                getMembers(projectId, {
                    page: 1,
                    perPage: 20,
                    search: memberSearch.trim() || undefined,
                    role: memberRoleFilter || undefined,
                }),
                searchUsersForAdd(projectId, {
                    page: 1,
                    perPage: 10,
                    search: '',
                }),
            ]);
        } catch (err) {
            console.error('Failed to add members:', err);
        } finally {
            setAddingMembersLoading(false);
        }
    };

    const handleUpdateMemberRole = async (
        member: ProjectMember,
        nextRole: ProjectRole,
    ) => {
        if (!projectId) return;
        if (member.role === nextRole) return;

        try {
            setUpdatingMemberRoleId(member.userId);
            await updateMemberRole(projectId, member.userId, nextRole);
        } catch (err) {
            console.error('Failed to update member role:', err);
        } finally {
            setUpdatingMemberRoleId(null);
        }
    };

    const getAvailableRolesForMember = (member: ProjectMember): ProjectRole[] => {
        if (isOwner) {
            if (member.role === 'owner') return ['owner'];
            return ['member', 'admin'];
        }

        if (isAdmin) {
            if (member.role === 'member') return ['member', 'admin'];
            return [member.role];
        }

        return [member.role];
    };

    const getAvailableRolesForAdd = (): ProjectRole[] => {
        if (isOwner) return ['member', 'admin'];
        if (isAdmin) return ['member'];
        return ['member'];
    };

    const handleDragEnd = async (result: DropResult) => {
        if (activeStatusTab !== 'active') return;

        const { source, destination } = result;

        if (!projectId || !destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const prevColumns = localColumns.map((column) => ({
            ...column,
            tasks: [...column.tasks],
        }));

        const nextColumns = localColumns.map((column) => ({
            ...column,
            tasks: [...column.tasks],
        }));

        const sourceColumnIndex = nextColumns.findIndex(
            (col) => col._id === source.droppableId,
        );
        const destinationColumnIndex = nextColumns.findIndex(
            (col) => col._id === destination.droppableId,
        );

        if (sourceColumnIndex === -1 || destinationColumnIndex === -1) return;

        const sourceColumn = nextColumns[sourceColumnIndex];
        const destinationColumn = nextColumns[destinationColumnIndex];

        const sourceTasks = [...sourceColumn.tasks];
        const destinationTasks =
            source.droppableId === destination.droppableId
                ? sourceTasks
                : [...destinationColumn.tasks];

        const [movedTask] = sourceTasks.splice(source.index, 1);
        if (!movedTask) return;

        const updatedMovedTask: Task = {
            ...movedTask,
            columnId: destination.droppableId,
        };

        destinationTasks.splice(destination.index, 0, updatedMovedTask);

        if (source.droppableId === destination.droppableId) {
            nextColumns[sourceColumnIndex] = {
                ...sourceColumn,
                tasks: destinationTasks.map((task, index) => ({
                    ...task,
                    order: index,
                    columnId: source.droppableId,
                })),
            };
        } else {
            nextColumns[sourceColumnIndex] = {
                ...sourceColumn,
                tasks: sourceTasks.map((task, index) => ({
                    ...task,
                    order: index,
                    columnId: source.droppableId,
                })),
            };

            nextColumns[destinationColumnIndex] = {
                ...destinationColumn,
                tasks: destinationTasks.map((task, index) => ({
                    ...task,
                    order: index,
                    columnId: destination.droppableId,
                })),
            };
        }

        setLocalColumns(nextColumns);

        try {
            if (source.droppableId === destination.droppableId) {
                const reorderedTasks = nextColumns[sourceColumnIndex].tasks;

                await Promise.all(
                    reorderedTasks.map((task, index) =>
                        useProjectStore.getState().updateTask(
                            projectId,
                            source.droppableId,
                            task._id,
                            {
                                columnId: source.droppableId,
                                order: index,
                            },
                        ),
                    ),
                );

                await loadColumnTasks(projectId, source.droppableId, {
                    limit: columnTasks[source.droppableId]?.meta?.limit ?? 20,
                    reset: true,
                    statuses: activeStatuses,
                });
            } else {
                const updatedSourceTasks = nextColumns[sourceColumnIndex].tasks;
                const updatedDestinationTasks = nextColumns[destinationColumnIndex].tasks;

                await Promise.all([
                    ...updatedSourceTasks.map((task, index) =>
                        useProjectStore.getState().updateTask(
                            projectId,
                            source.droppableId,
                            task._id,
                            {
                                columnId: source.droppableId,
                                order: index,
                            },
                        ),
                    ),
                    ...updatedDestinationTasks.map((task, index) =>
                        useProjectStore.getState().updateTask(
                            projectId,
                            task._id === movedTask._id
                                ? source.droppableId
                                : destination.droppableId,
                            task._id,
                            {
                                columnId: destination.droppableId,
                                order: index,
                            },
                        ),
                    ),
                ]);

                await Promise.all([
                    loadColumnTasks(projectId, source.droppableId, {
                        limit: columnTasks[source.droppableId]?.meta?.limit ?? 20,
                        reset: true,
                        statuses: activeStatuses,
                    }),
                    loadColumnTasks(projectId, destination.droppableId, {
                        limit: columnTasks[destination.droppableId]?.meta?.limit ?? 20,
                        reset: true,
                        statuses: activeStatuses,
                    }),
                ]);
            }
        } catch (err) {
            console.error('Failed to persist drag and drop:', err);
            setLocalColumns(prevColumns);

            await Promise.all([
                loadColumnTasks(projectId, source.droppableId, {
                    limit: columnTasks[source.droppableId]?.meta?.limit ?? 20,
                    reset: true,
                    statuses: activeStatuses,
                }),
                source.droppableId !== destination.droppableId
                    ? loadColumnTasks(projectId, destination.droppableId, {
                        limit: columnTasks[destination.droppableId]?.meta?.limit ?? 20,
                        reset: true,
                        statuses: activeStatuses,
                    })
                    : Promise.resolve(),
            ]);
        }
    };

    useEffect(() => {
        loadProjectPageData().catch(console.error);
    }, [projectId]);

    useEffect(() => {
        setLocalColumns(projectColumns);
    }, [projectColumns]);

    useEffect(() => {
        setProjectTitleDraft(project?.title ?? '');
        setProjectDescriptionDraft(project?.description ?? '');
    }, [project?.title, project?.description]);

    useEffect(() => {
        if (projectColumns.length > 0 && !newTask.columnId) {
            setNewTask((prev) => ({
                ...prev,
                columnId: projectColumns[0]._id,
            }));
        }
    }, [projectColumns, newTask.columnId]);

    useEffect(() => {
        if (!projectId || projectColumns.length === 0) return;

        projectColumns.forEach((column) => {
            const state = useProjectStore.getState().columnTasks[column._id];

            if (!state?.initialized && !state?.loading && !state?.loadingMore) {
                loadColumnTasks(projectId, column._id, {
                    limit: 20,
                    reset: true,
                    statuses: activeStatuses,
                }).catch((err) => {
                    console.error(`Failed to load tasks for column ${column._id}:`, err);
                });
            }
        });
    }, [projectId, projectColumns, activeStatuses]);

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenColumnMenuId(null);
            setOpenTaskMenuId(null);
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!projectId || !isUsersModalOpen || !canManageMembers) return;

        const timeout = setTimeout(() => {
            searchUsersForAdd(projectId, {
                page: 1,
                perPage: 10,
                search: addUserSearch.trim() || undefined,
            }).catch((err) => {
                console.error('Failed to search users for add:', err);
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [projectId, isUsersModalOpen, addUserSearch, canManageMembers, searchUsersForAdd]);

    const renderAssigneeDropdown = ({
                                        selectedIds,
                                        selectedMembers,
                                        toggleAssignee,
                                        isOpen,
                                        onToggle,
                                        onClose,
                                        onClear,
                                        scrollRef,
                                        onScroll,
                                    }: {
        selectedIds: string[];
        selectedMembers: ProjectMember[];
        toggleAssignee: (id: string) => void;
        isOpen: boolean;
        onToggle: () => void;
        onClose: () => void;
        onClear: () => void;
        scrollRef: React.RefObject<HTMLDivElement | null>;
        onScroll: () => Promise<void>;
    }) => (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Исполнители
            </label>

            <button
                type="button"
                onClick={onToggle}
                className="w-full min-h-[52px] px-4 py-3 border border-slate-300 rounded-2xl text-left focus:outline-none focus:border-indigo-500 bg-white"
            >
                {selectedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((member) => (
                            <span
                                key={member.userId}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-3xl text-sm"
                            >
                                {member.user?.fullName || member.user?.email}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAssignee(member.userId);
                                    }}
                                    className="text-indigo-400 hover:text-red-500"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-slate-400">Выбрать исполнителей</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-slate-100">
                        <input
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => handleAssigneeSearchChange(e.target.value)}
                            placeholder="Поиск по имени или email"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div
                        ref={scrollRef}
                        onScroll={() => {
                            void onScroll();
                        }}
                        className="max-h-64 overflow-y-auto p-2"
                    >
                        {assigneeOptionsLoading ? (
                            <div className="px-3 py-4 text-sm text-slate-500">Загрузка...</div>
                        ) : assigneeOptions.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-slate-500">
                                Ничего не найдено
                            </div>
                        ) : (
                            <>
                                {assigneeOptions.map((member) => {
                                    const checked = selectedIds.includes(member.userId);

                                    return (
                                        <label
                                            key={member.userId}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleAssignee(member.userId)}
                                                className="h-4 w-4 rounded border-slate-300"
                                            />

                                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold rounded-2xl flex items-center justify-center text-xs shrink-0">
                                                {initials(member.user?.fullName, member.user?.email)}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-slate-900 truncate">
                                                    {member.user?.fullName || 'No name'}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {member.user?.email}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {formatRole(member.role)}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}

                                {assigneeOptionsLoadingMore && (
                                    <div className="px-3 py-3 text-sm text-slate-500">
                                        Загрузка ещё...
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {(assigneeOptionsError || assigneeOptionsMeta) && (
                        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                            {assigneeOptionsError ? (
                                <div className="text-xs text-red-600">{assigneeOptionsError}</div>
                            ) : (
                                <div className="text-xs text-slate-500">
                                    Показано {assigneeOptions.length} из{' '}
                                    {assigneeOptionsMeta?.total ?? assigneeOptions.length}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 p-3 border-t border-slate-100 bg-slate-50">
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            Очистить
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl"
                        >
                            Готово
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (projectLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600 text-lg font-medium">Loading project...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="px-8 py-6 flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
                            {project?.title?.substring(0, 1).toUpperCase() || 'P'}
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                <Link
                                    to="/projects"
                                    className="font-medium hover:text-indigo-600 transition-colors"
                                >
                                    Projects
                                </Link>
                                <span className="text-slate-300">✦</span>
                                <span className="truncate text-slate-700 font-medium">
                                    {project?.title || 'Project'}
                                </span>
                            </div>

                            {isEditingProjectTitle ? (
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={projectTitleDraft}
                                        onChange={(e) => setProjectTitleDraft(e.target.value)}
                                        onBlur={handleSaveProjectTitle}
                                        onKeyDown={(e) =>
                                            handleInputHotkeys(
                                                e,
                                                handleSaveProjectTitle,
                                                cancelProjectTitleEdit,
                                            )
                                        }
                                        className="w-full max-w-xl px-4 py-2.5 text-2xl font-semibold border border-indigo-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                    {savingProject && (
                                        <span className="text-sm text-slate-500">Сохранение...</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mb-2">
                                    <h1
                                        onClick={startProjectTitleEdit}
                                        className="text-2xl font-semibold text-slate-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                        title="Нажми, чтобы изменить название"
                                    >
                                        {project?.title || 'Project'}
                                    </h1>

                                    <button
                                        type="button"
                                        onClick={startProjectTitleEdit}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                                    >
                                        Edit title
                                    </button>
                                </div>
                            )}

                            {isEditingProjectDescription ? (
                                <div className="flex items-start gap-3">
                                    <textarea
                                        autoFocus
                                        rows={2}
                                        value={projectDescriptionDraft}
                                        onChange={(e) =>
                                            setProjectDescriptionDraft(e.target.value)
                                        }
                                        onBlur={handleSaveProjectDescription}
                                        onKeyDown={(e) =>
                                            handleInputHotkeys(
                                                e,
                                                handleSaveProjectDescription,
                                                cancelProjectDescriptionEdit,
                                            )
                                        }
                                        className="w-full max-w-2xl px-4 py-3 text-sm text-slate-700 border border-indigo-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Добавь описание проекта"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <p
                                        onClick={startProjectDescriptionEdit}
                                        className="text-slate-500 text-sm max-w-2xl cursor-pointer hover:text-slate-700 transition-colors"
                                        title="Нажми, чтобы изменить описание"
                                    >
                                        {project?.description || 'No description'}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={startProjectDescriptionEdit}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition shrink-0"
                                    >
                                        Edit description
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <button
                            onClick={() => openCreateTaskModal()}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95"
                        >
                            + Create task
                        </button>

                        <button
                            onClick={handleOpenMembersModal}
                            className="flex items-center gap-3 hover:bg-slate-100 px-5 py-3 rounded-2xl transition-colors"
                        >
                            <span className="font-medium text-slate-700">Members</span>

                            <div className="flex -space-x-3">
                                {visibleMembers.map((member) => (
                                    <div
                                        key={member._id}
                                        className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold border-2 border-white rounded-2xl flex items-center justify-center shadow"
                                        title={member.user?.fullName || member.user?.email}
                                    >
                                        {initials(member.user?.fullName, member.user?.email)}
                                    </div>
                                ))}
                            </div>

                            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-3xl font-medium">
                                {membersMeta?.total ?? members.length}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-8">
                {projectError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                        {projectError}
                    </div>
                )}

                <div className="mb-8">
                    <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        {STATUS_TABS.map((tab) => {
                            const isActive = activeStatusTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleStatusTabChange(tab.key)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-800">Kanban Board</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Текущий статус:{' '}
                            {STATUS_TABS.find((tab) => tab.key === activeStatusTab)?.label}
                        </p>
                    </div>

                    {isAddingColumn ? (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newColumnTitle}
                                onChange={(e) => setNewColumnTitle(e.target.value)}
                                placeholder="Название новой колонки"
                                className="px-5 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-400 w-80"
                                autoFocus
                            />

                            <button
                                onClick={handleCreateColumn}
                                disabled={submittingColumn}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-medium disabled:opacity-60"
                            >
                                {submittingColumn ? 'Создание...' : 'Создать'}
                            </button>

                            <button
                                onClick={() => {
                                    setIsAddingColumn(false);
                                    setNewColumnTitle('');
                                }}
                                className="px-6 py-3 text-slate-500 hover:text-slate-700"
                            >
                                Отмена
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingColumn(true)}
                            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                        >
                            + Новая колонка
                        </button>
                    )}
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 overflow-x-auto pb-12 snap-x scrollbar-thin scrollbar-thumb-slate-300">
                        {localColumns.map((col) => {
                            const columnState = columnTasks[col._id];
                            const isBacklog = col.title.toLowerCase() === 'backlog';
                            const isDeleting = deletingColumnId === col._id;
                            const isMenuOpen = openColumnMenuId === col._id;
                            const isEditingColumn = editingColumnId === col._id;
                            const isSavingColumn = savingColumnId === col._id;

                            return (
                                <Droppable
                                    key={col._id}
                                    droppableId={col._id}
                                    isDropDisabled={activeStatusTab !== 'active'}
                                >
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`bg-white w-80 flex-shrink-0 rounded-3xl border border-slate-200 flex flex-col h-[calc(100vh-240px)] shadow-sm transition-all ${
                                                snapshot.isDraggingOver && activeStatusTab === 'active'
                                                    ? 'border-indigo-400 shadow'
                                                    : ''
                                            }`}
                                        >
                                            <div className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {isEditingColumn ? (
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={columnTitleDraft}
                                                                onChange={(e) =>
                                                                    setColumnTitleDraft(e.target.value)
                                                                }
                                                                onBlur={() => handleSaveColumnTitle(col)}
                                                                onKeyDown={(e) =>
                                                                    handleInputHotkeys(
                                                                        e,
                                                                        () => handleSaveColumnTitle(col),
                                                                        cancelColumnEdit,
                                                                    )
                                                                }
                                                                className="w-full min-w-0 px-3 py-2 text-lg font-semibold border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                            />
                                                            {isSavingColumn && (
                                                                <span className="text-xs text-slate-500">
                                                                    Saving...
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h3
                                                                onClick={() => startColumnEdit(col)}
                                                                className="font-semibold text-xl text-slate-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                                                title="Нажми, чтобы переименовать колонку"
                                                            >
                                                                {col.title}
                                                            </h3>

                                                            <span className="bg-slate-100 text-slate-600 px-3.5 py-1 text-sm rounded-3xl font-medium">
                                                                {col.tasks.length}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {!isEditingColumn && (
                                                    <div className="relative shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenTaskMenuId(null);
                                                                setOpenColumnMenuId((prev) =>
                                                                    prev === col._id ? null : col._id,
                                                                );
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                                                        >
                                                            <span className="text-xl leading-none">⋯</span>
                                                        </button>

                                                        {isMenuOpen && (
                                                            <div
                                                                className="absolute right-0 top-12 z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startColumnEdit(col)}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    Rename
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenColumnMenuId(null);
                                                                        openCreateTaskModal(col._id);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    + Task
                                                                </button>

                                                                {!isBacklog && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenColumnMenuId(null);
                                                                            handleDeleteColumn(col);
                                                                        }}
                                                                        disabled={isDeleting}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                                    >
                                                                        {isDeleting
                                                                            ? 'Deleting...'
                                                                            : 'Delete'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                className="flex-1 px-3 space-y-3 overflow-y-auto pb-6"
                                                onScroll={(e) => handleColumnScroll(col._id, e)}
                                            >
                                                {columnState?.loading ? (
                                                    <div className="px-3 py-6 text-sm text-slate-500">
                                                        Загрузка задач...
                                                    </div>
                                                ) : columnState?.error ? (
                                                    <div className="mx-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                                        {columnState.error}
                                                    </div>
                                                ) : col.tasks.length === 0 ? (
                                                    <div className="px-3 py-6 text-sm text-slate-400">
                                                        В этой колонке пока нет задач
                                                    </div>
                                                ) : null}

                                                {col.tasks.map((task, index) => {
                                                    const isTaskMenuOpen = openTaskMenuId === task._id;
                                                    const isChangingStatus =
                                                        changingTaskStatusId === task._id;

                                                    return (
                                                        <Draggable
                                                            key={task._id}
                                                            draggableId={task._id}
                                                            index={index}
                                                            isDragDisabled={activeStatusTab !== 'active'}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all ${
                                                                        activeStatusTab === 'active'
                                                                            ? 'cursor-pointer'
                                                                            : 'cursor-default'
                                                                    } ${
                                                                        snapshot.isDragging
                                                                            ? 'scale-105 shadow-xl'
                                                                            : ''
                                                                    }`}
                                                                    onClick={async () => {
                                                                        if (openTaskMenuId) return;
                                                                        await openEditTaskModal(task, col._id);
                                                                    }}
                                                                >
                                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                                        <h4 className="font-medium text-slate-900 leading-tight">
                                                                            {task.title}
                                                                        </h4>

                                                                        <div
                                                                            className="relative shrink-0"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenColumnMenuId(null);
                                                                                    setOpenTaskMenuId((prev) =>
                                                                                        prev === task._id
                                                                                            ? null
                                                                                            : task._id,
                                                                                    );
                                                                                }}
                                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                                            >
                                                                                <span className="text-lg leading-none">
                                                                                    ⋯
                                                                                </span>
                                                                            </button>

                                                                            {isTaskMenuOpen && (
                                                                                <div className="absolute right-0 top-10 z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-2">
                                                                                    {activeStatusTab === 'active' && (
                                                                                        <>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleDoneTask(
                                                                                                        task,
                                                                                                        col._id,
                                                                                                    )
                                                                                                }
                                                                                                disabled={isChangingStatus}
                                                                                                className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                                                                            >
                                                                                                {isChangingStatus
                                                                                                    ? 'Updating...'
                                                                                                    : 'Mark as done'}
                                                                                            </button>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleArchiveTask(
                                                                                                        task,
                                                                                                        col._id,
                                                                                                    )
                                                                                                }
                                                                                                disabled={isChangingStatus}
                                                                                                className="w-full text-left px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                                                                            >
                                                                                                {isChangingStatus
                                                                                                    ? 'Archiving...'
                                                                                                    : 'Archive'}
                                                                                            </button>
                                                                                        </>
                                                                                    )}

                                                                                    {activeStatusTab === 'done' && (
                                                                                        <>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleRestoreTaskToActive(
                                                                                                        task,
                                                                                                        col._id,
                                                                                                    )
                                                                                                }
                                                                                                disabled={isChangingStatus}
                                                                                                className="w-full text-left px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                                                                            >
                                                                                                {isChangingStatus
                                                                                                    ? 'Updating...'
                                                                                                    : 'Move to active'}
                                                                                            </button>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleArchiveTask(
                                                                                                        task,
                                                                                                        col._id,
                                                                                                    )
                                                                                                }
                                                                                                disabled={isChangingStatus}
                                                                                                className="w-full text-left px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                                                                            >
                                                                                                {isChangingStatus
                                                                                                    ? 'Archiving...'
                                                                                                    : 'Archive'}
                                                                                            </button>
                                                                                        </>
                                                                                    )}

                                                                                    {activeStatusTab === 'archived' && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                handleRestoreTaskToActive(
                                                                                                    task,
                                                                                                    col._id,
                                                                                                )
                                                                                            }
                                                                                            disabled={isChangingStatus}
                                                                                            className="w-full text-left px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                                                                        >
                                                                                            {isChangingStatus
                                                                                                ? 'Updating...'
                                                                                                : 'Restore to active'}
                                                                                        </button>
                                                                                    )}

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={async () => {
                                                                                            setOpenTaskMenuId(null);
                                                                                            await openEditTaskModal(
                                                                                                task,
                                                                                                col._id,
                                                                                            );
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {task.description && (
                                                                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                                                                            {task.description}
                                                                        </p>
                                                                    )}

                                                                    {!!task.labels?.length && (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {task.labels.map((label, i) => (
                                                                                <span
                                                                                    key={`${task._id}-${label}-${i}`}
                                                                                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-3xl font-medium"
                                                                                >
                                                                                    {label}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {!!task.assignees?.length && (
                                                                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                                                                            {task.assignees.map((assignee) => (
                                                                                <div
                                                                                    key={assignee._id}
                                                                                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-2xl"
                                                                                    title={
                                                                                        assignee.fullName ||
                                                                                        assignee.email
                                                                                    }
                                                                                >
                                                                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                                                                        {initials(
                                                                                            assignee.fullName,
                                                                                            assignee.email,
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-xs text-slate-700">
                                                                                        {assignee.fullName ||
                                                                                            assignee.email}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {task.location?.coordinates?.length === 2 && (
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${task.location.coordinates[1]},${task.location.coordinates[0]}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="mt-3 inline-flex items-center gap-2 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                                                                            title="Open location in Google Maps"
                                                                        >
                                                                            <span className="text-sm">📍</span>
                                                                            <span className="truncate">{formatTaskLocation(task)}</span>
                                                                        </a>
                                                                    )}

                                                                    {task.deadline && (
                                                                        <div className="mt-4 text-xs flex items-center gap-1.5 text-amber-600">
                                                                            <span>📅</span>
                                                                            <span>
                                                                                {formatDeadline(task.deadline)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}

                                                {provided.placeholder}

                                                {columnState?.loadingMore && (
                                                    <div className="px-3 py-3 text-sm text-slate-500">
                                                        Загрузка ещё...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {isCreateTaskModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={closeCreateTaskModal}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 pt-8 pb-6 border-b">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Новая задача
                            </h2>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Заголовок
                                </label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) =>
                                        setNewTask((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="w-full px-5 py-3 border border-slate-300 rounded-2xl focus:border-indigo-500 focus:outline-none"
                                    placeholder="Введите название задачи"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Описание
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) =>
                                        setNewTask((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={4}
                                    className="w-full px-5 py-3 border border-slate-300 rounded-2xl focus:border-indigo-500 focus:outline-none resize-y"
                                    placeholder="Подробное описание..."
                                />
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Location
                                    </label>

                                    <button
                                        type="button"
                                        onClick={fillCurrentLocationForCreate}
                                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        Use current location
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        value={newTask.location.lat}
                                        onChange={(e) =>
                                            setNewTask((prev) => ({
                                                ...prev,
                                                location: {
                                                    ...prev.location,
                                                    lat: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                        placeholder="Latitude"
                                    />

                                    <input
                                        type="text"
                                        value={newTask.location.lng}
                                        onChange={(e) =>
                                            setNewTask((prev) => ({
                                                ...prev,
                                                location: {
                                                    ...prev.location,
                                                    lng: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                        placeholder="Longitude"
                                    />
                                </div>

                                {(newTask.location.lat || newTask.location.lng) && (
                                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>
                {newTask.location.lat || '—'}, {newTask.location.lng || '—'}
            </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setNewTask((prev) => ({
                                                    ...prev,
                                                    location: emptyLocation(),
                                                }))
                                            }
                                            className="text-rose-600 hover:text-rose-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Колонка
                                    </label>
                                    <select
                                        value={newTask.columnId}
                                        onChange={(e) =>
                                            setNewTask((prev) => ({
                                                ...prev,
                                                columnId: e.target.value,
                                            }))
                                        }
                                        className="w-full px-5 py-3 border border-slate-300 rounded-2xl focus:border-indigo-500"
                                    >
                                        {projectColumns.map((col) => (
                                            <option key={col._id} value={col._id}>
                                                {col.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Дедлайн
                                    </label>
                                    <input
                                        type="date"
                                        value={newTask.deadline}
                                        onChange={(e) =>
                                            setNewTask((prev) => ({
                                                ...prev,
                                                deadline: e.target.value,
                                            }))
                                        }
                                        className="w-full px-5 py-3 border border-slate-300 rounded-2xl focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {renderAssigneeDropdown({
                                selectedIds: newTask.assigneeIds,
                                selectedMembers: selectedCreateAssignees,
                                toggleAssignee: toggleCreateAssignee,
                                isOpen: isAssigneeDropdownOpen,
                                onToggle: handleToggleCreateAssigneeDropdown,
                                onClose: () => setIsAssigneeDropdownOpen(false),
                                onClear: () =>
                                    setNewTask((prev) => ({
                                        ...prev,
                                        assigneeIds: [],
                                    })),
                                scrollRef: assigneeListRef,
                                onScroll: handleCreateAssigneeScroll,
                            })}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Теги (Enter для добавления)
                                </label>

                                <input
                                    type="text"
                                    placeholder="Например: Backend, MongoDB"
                                    className="w-full px-5 py-3 border border-slate-300 rounded-2xl focus:border-indigo-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            e.preventDefault();

                                            const tag = e.currentTarget.value.trim();

                                            if (!newTask.labels.includes(tag)) {
                                                setNewTask((prev) => ({
                                                    ...prev,
                                                    labels: [...prev.labels, tag],
                                                }));
                                            }

                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {newTask.labels.map((label, i) => (
                                        <span
                                            key={`${label}-${i}`}
                                            className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-100 text-indigo-700 rounded-3xl text-sm"
                                        >
                                            {label}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setNewTask((prev) => ({
                                                        ...prev,
                                                        labels: prev.labels.filter(
                                                            (_, idx) => idx !== i,
                                                        ),
                                                    }))
                                                }
                                                className="text-indigo-400 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t px-8 py-6 flex gap-4">
                            <button
                                onClick={closeCreateTaskModal}
                                className="flex-1 py-4 text-slate-600 font-medium hover:bg-slate-100 rounded-2xl transition"
                            >
                                Отмена
                            </button>

                            <button
                                onClick={handleCreateTask}
                                disabled={submittingTask}
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition disabled:opacity-60"
                            >
                                {submittingTask ? 'Создание...' : 'Создать задачу'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditTaskModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 p-4 sm:p-6"
                    onClick={closeEditTaskModal}
                >
                    <div className="flex min-h-full items-center justify-center">
                        <div
                            className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex h-[92vh] max-h-[920px] flex-col">
                                <div className="shrink-0 border-b border-slate-200 px-6 py-5 sm:px-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h2 className="text-2xl font-semibold text-slate-900">
                                                Edit task
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Update task details, assignees and comments
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={closeEditTaskModal}
                                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                                        <div className="space-y-6">
                                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editTask.title}
                                                    onChange={(e) =>
                                                        setEditTask((prev) => ({
                                                            ...prev,
                                                            title: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                                    placeholder="Task title"
                                                />
                                            </div>

                                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={editTask.description}
                                                    onChange={(e) =>
                                                        setEditTask((prev) => ({
                                                            ...prev,
                                                            description: e.target.value,
                                                        }))
                                                    }
                                                    rows={6}
                                                    className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                                    placeholder="Describe the task"
                                                />
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-800">Location</h4>
                                                        <p className="text-xs text-slate-500">
                                                            You can edit latitude and longitude manually or use current location
                                                        </p>
                                                    </div>

                                                    {editTask.location.lat || editTask.location.lng ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setEditTask((prev) => ({
                                                                    ...prev,
                                                                    removeLocation: true,
                                                                    location: emptyLocation(),
                                                                }))
                                                            }
                                                            className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : null}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            Latitude
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={editTask.location.lat}
                                                            onChange={(e) =>
                                                                setEditTask((prev) => ({
                                                                    ...prev,
                                                                    removeLocation: false,
                                                                    location: {
                                                                        ...prev.location,
                                                                        lat: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="50.4501"
                                                            className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500 bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            Longitude
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={editTask.location.lng}
                                                            onChange={(e) =>
                                                                setEditTask((prev) => ({
                                                                    ...prev,
                                                                    removeLocation: false,
                                                                    location: {
                                                                        ...prev.location,
                                                                        lng: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="30.5234"
                                                            className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500 bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={fillCurrentLocationForEdit}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl"
                                                    >
                                                        Use current location
                                                    </button>

                                                    {(editTask.location.lat || editTask.location.lng) && !editTask.removeLocation && (
                                                        <span className="text-xs text-slate-500">
                Current: {editTask.location.lat}, {editTask.location.lng}
            </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                                        Column
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            projectColumns.find(
                                                                (item) => item._id === editTask.columnId,
                                                            )?.title || ''
                                                        }
                                                        disabled
                                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                                                    />
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                                        Deadline
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={editTask.deadline}
                                                        onChange={(e) =>
                                                            setEditTask((prev) => ({
                                                                ...prev,
                                                                deadline: e.target.value,
                                                            }))
                                                        }
                                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                {renderAssigneeDropdown({
                                                    selectedIds: editTask.assigneeIds,
                                                    selectedMembers: selectedEditAssignees,
                                                    toggleAssignee: toggleEditAssignee,
                                                    isOpen: isEditAssigneeDropdownOpen,
                                                    onToggle: handleToggleEditAssigneeDropdown,
                                                    onClose: () => setIsEditAssigneeDropdownOpen(false),
                                                    onClear: () =>
                                                        setEditTask((prev) => ({
                                                            ...prev,
                                                            assigneeIds: [],
                                                        })),
                                                    scrollRef: editAssigneeListRef,
                                                    onScroll: handleEditAssigneeScroll,
                                                })}
                                            </div>

                                            <div className="rounded-3xl border border-slate-200 bg-white p-5">
                                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                                    Labels (press Enter to add)
                                                </label>

                                                <input
                                                    type="text"
                                                    placeholder="Example: Backend, MongoDB"
                                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                            e.preventDefault();

                                                            const tag = e.currentTarget.value.trim();

                                                            if (!editTask.labels.includes(tag)) {
                                                                setEditTask((prev) => ({
                                                                    ...prev,
                                                                    labels: [...prev.labels, tag],
                                                                }));
                                                            }

                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {editTask.labels.map((label, i) => (
                                                        <span
                                                            key={`${label}-${i}`}
                                                            className="inline-flex items-center gap-2 rounded-3xl bg-indigo-100 px-4 py-1.5 text-sm text-indigo-700"
                                                        >
                                                {label}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditTask((prev) => ({
                                                                        ...prev,
                                                                        labels: prev.labels.filter(
                                                                            (_, idx) => idx !== i,
                                                                        ),
                                                                    }))
                                                                }
                                                                className="text-indigo-400 hover:text-red-500"
                                                            >
                                                    ✕
                                                </button>
                                            </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="min-h-0">
                                            <div className="flex h-full max-h-[calc(92vh-150px)] flex-col rounded-3xl border border-slate-200 bg-slate-50">
                                                <div className="shrink-0 border-b border-slate-200 px-5 py-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <h3 className="text-lg font-semibold text-slate-900">
                                                            Comments
                                                        </h3>

                                                        {currentTaskCommentsState?.meta && (
                                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                                    {currentTaskCommentsState.meta.total}
                                                </span>
                                                        )}
                                                    </div>

                                                    {replyToCommentId && (
                                                        <div className="mt-3 rounded-2xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                                                            Reply mode enabled
                                                            <button
                                                                type="button"
                                                                onClick={() => setReplyToCommentId(null)}
                                                                className="ml-3 font-medium hover:text-indigo-900"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    ref={commentsListRef}
                                                    onScroll={() => {
                                                        void handleCommentsScroll();
                                                    }}
                                                    className="flex-1 overflow-y-auto px-5 py-4"
                                                >
                                                    {currentTaskCommentsState?.loading ? (
                                                        <div className="text-sm text-slate-500">
                                                            Loading comments...
                                                        </div>
                                                    ) : currentTaskCommentsState?.error ? (
                                                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                                            {currentTaskCommentsState.error}
                                                        </div>
                                                    ) : currentTaskComments.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-400">
                                                            No comments yet
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {renderCommentsTree(currentTaskComments)}
                                                            {currentTaskCommentsState?.loadingMore && (
                                                                <div className="pt-3 text-center text-sm text-slate-500">
                                                                    Loading more comments...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
                                                    <div className="space-y-3">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                rows={4}
                                                placeholder="Write a comment..."
                                                className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500"
                                            />

                                                        <div className="flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={handleCreateComment}
                                                                disabled={
                                                                    submittingComment || !newComment.trim()
                                                                }
                                                                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                                            >
                                                                {submittingComment
                                                                    ? 'Sending...'
                                                                    : 'Send comment'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-5 sm:px-8">
                                    <div className="flex flex-wrap gap-3">
                                        {activeStatusTab === 'active' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleDoneTask(
                                                            {
                                                                _id: editTask._id,
                                                                columnId: editTask.columnId,
                                                                title: editTask.title,
                                                                description: editTask.description,
                                                                labels: editTask.labels,
                                                                assigneeIds: editTask.assigneeIds,
                                                                deadline: editTask.deadline,
                                                                parentTaskId: editTask.parentTaskId,
                                                            },
                                                            editTask.columnId,
                                                        )
                                                    }
                                                    disabled={changingTaskStatusId === editTask._id}
                                                    className="rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                                >
                                                    {changingTaskStatusId === editTask._id
                                                        ? 'Updating...'
                                                        : 'Mark as done'}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleArchiveTask(
                                                            {
                                                                _id: editTask._id,
                                                                columnId: editTask.columnId,
                                                                title: editTask.title,
                                                                description: editTask.description,
                                                                labels: editTask.labels,
                                                                assigneeIds: editTask.assigneeIds,
                                                                deadline: editTask.deadline,
                                                                parentTaskId: editTask.parentTaskId,
                                                            },
                                                            editTask.columnId,
                                                        )
                                                    }
                                                    disabled={changingTaskStatusId === editTask._id}
                                                    className="rounded-2xl bg-amber-50 px-5 py-3 text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                                                >
                                                    {changingTaskStatusId === editTask._id
                                                        ? 'Updating...'
                                                        : 'Archive'}
                                                </button>
                                            </>
                                        )}

                                        {activeStatusTab === 'done' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleRestoreTaskToActive(
                                                            {
                                                                _id: editTask._id,
                                                                columnId: editTask.columnId,
                                                                title: editTask.title,
                                                                description: editTask.description,
                                                                labels: editTask.labels,
                                                                assigneeIds: editTask.assigneeIds,
                                                                deadline: editTask.deadline,
                                                                parentTaskId: editTask.parentTaskId,
                                                            },
                                                            editTask.columnId,
                                                        )
                                                    }
                                                    disabled={changingTaskStatusId === editTask._id}
                                                    className="rounded-2xl bg-indigo-50 px-5 py-3 text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                                                >
                                                    {changingTaskStatusId === editTask._id
                                                        ? 'Updating...'
                                                        : 'Move to active'}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleArchiveTask(
                                                            {
                                                                _id: editTask._id,
                                                                columnId: editTask.columnId,
                                                                title: editTask.title,
                                                                description: editTask.description,
                                                                labels: editTask.labels,
                                                                assigneeIds: editTask.assigneeIds,
                                                                deadline: editTask.deadline,
                                                                parentTaskId: editTask.parentTaskId,
                                                            },
                                                            editTask.columnId,
                                                        )
                                                    }
                                                    disabled={changingTaskStatusId === editTask._id}
                                                    className="rounded-2xl bg-amber-50 px-5 py-3 text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                                                >
                                                    {changingTaskStatusId === editTask._id
                                                        ? 'Updating...'
                                                        : 'Archive'}
                                                </button>
                                            </>
                                        )}

                                        {activeStatusTab === 'archived' && (
                                            <button
                                                onClick={() =>
                                                    handleRestoreTaskToActive(
                                                        {
                                                            _id: editTask._id,
                                                            columnId: editTask.columnId,
                                                            title: editTask.title,
                                                            description: editTask.description,
                                                            labels: editTask.labels,
                                                            assigneeIds: editTask.assigneeIds,
                                                            deadline: editTask.deadline,
                                                            parentTaskId: editTask.parentTaskId,
                                                        },
                                                        editTask.columnId,
                                                    )
                                                }
                                                disabled={changingTaskStatusId === editTask._id}
                                                className="rounded-2xl bg-indigo-50 px-5 py-3 text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                                            >
                                                {changingTaskStatusId === editTask._id
                                                    ? 'Updating...'
                                                    : 'Restore to active'}
                                            </button>
                                        )}

                                        <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                            <button
                                                onClick={closeEditTaskModal}
                                                className="min-w-[140px] rounded-2xl px-5 py-3 font-medium text-slate-600 transition hover:bg-slate-100"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                onClick={handleSaveTask}
                                                disabled={savingTask}
                                                className="min-w-[160px] rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                            >
                                                {savingTask ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isUsersModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setIsUsersModalOpen(false);
                        resetSearchUsersForAdd();
                        setSelectedUserIdsToAdd([]);
                        setAddUserSearch('');
                    }}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 pt-8 pb-6 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Project members
                            </h2>

                            <button
                                onClick={() => {
                                    setIsUsersModalOpen(false);
                                    resetSearchUsersForAdd();
                                    setSelectedUserIdsToAdd([]);
                                    setAddUserSearch('');
                                }}
                                className="text-3xl text-slate-400 hover:text-slate-900"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 border-b bg-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Search by name or email"
                                    className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500"
                                />

                                <select
                                    value={memberRoleFilter}
                                    onChange={(e) =>
                                        setMemberRoleFilter(
                                            (e.target.value as ProjectRole | '') || '',
                                        )
                                    }
                                    className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">All roles</option>
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                </select>

                                <button
                                    onClick={handleApplyMembersFilter}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium"
                                >
                                    Apply
                                </button>
                            </div>

                            {membersError && (
                                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {membersError}
                                </div>
                            )}
                        </div>

                        {canManageMembers && (
                            <div className="p-6 border-b bg-white space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Add users to project
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
                                    <input
                                        type="text"
                                        value={addUserSearch}
                                        onChange={(e) => setAddUserSearch(e.target.value)}
                                        placeholder="Search users by name or email"
                                        className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500"
                                    />

                                    <select
                                        value={addUserRole}
                                        onChange={(e) =>
                                            setAddUserRole(e.target.value as ProjectRole)
                                        }
                                        className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-indigo-500"
                                    >
                                        {getAvailableRolesForAdd().map((role) => (
                                            <option key={role} value={role}>
                                                {formatRole(role)}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleAddMembers}
                                        disabled={
                                            addingMembersLoading ||
                                            selectedUserIdsToAdd.length === 0
                                        }
                                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium disabled:opacity-50"
                                    >
                                        {addingMembersLoading ? 'Adding...' : 'Add selected'}
                                    </button>
                                </div>

                                {memberSearchUsersError && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {memberSearchUsersError}
                                    </div>
                                )}

                                <div className="max-h-56 overflow-y-auto space-y-2">
                                    {memberSearchUsersLoading ? (
                                        <div className="px-4 py-6 text-sm text-slate-500">
                                            Searching users...
                                        </div>
                                    ) : memberSearchUsers.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-slate-500">
                                            No users found
                                        </div>
                                    ) : (
                                        memberSearchUsers.map((user) => {
                                            const checked =
                                                selectedUserIdsToAdd.includes(user._id);

                                            return (
                                                <label
                                                    key={user._id}
                                                    className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            handleToggleUserToAdd(user._id)
                                                        }
                                                        className="h-4 w-4"
                                                    />

                                                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl flex items-center justify-center text-sm shadow shrink-0">
                                                        {initials(user.fullName, user.email)}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 truncate">
                                                            {user.fullName || 'No name'}
                                                        </div>
                                                        <div className="text-sm text-slate-500 truncate">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="text-xs text-slate-500">
                                    Found:{' '}
                                    <span className="font-medium">
                            {memberSearchUsersMeta?.total ?? memberSearchUsers.length}
                        </span>
                                </div>
                            </div>
                        )}

                        <div className="max-h-[460px] overflow-y-auto p-4">
                            {membersLoading ? (
                                <div className="px-4 py-10 text-center text-slate-500">
                                    Loading members...
                                </div>
                            ) : members.length === 0 ? (
                                <div className="px-4 py-10 text-center text-slate-500">
                                    No members found
                                </div>
                            ) : (
                                members.map((member) => {
                                    const isUpdatingRole = updatingMemberRoleId === member.userId;
                                    const isRemoving = removingMemberId === member.userId;

                                    return (
                                        <div
                                            key={member._id}
                                            className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 rounded-2xl group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold rounded-2xl flex items-center justify-center text-sm shadow shrink-0">
                                                    {initials(
                                                        member.user?.fullName,
                                                        member.user?.email,
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-900 truncate">
                                                        {member.user?.fullName || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-slate-500 truncate">
                                                        {member.user?.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                                {/* ROLE SELECT */}
                                                <select
                                                    value={member.role}
                                                    disabled={
                                                        !canManageMembers ||
                                                        member.role === 'owner' ||
                                                        isUpdatingRole
                                                    }
                                                    onChange={(e) =>
                                                        handleUpdateMemberRole(
                                                            member,
                                                            e.target.value as ProjectRole,
                                                        )
                                                    }
                                                    className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white disabled:opacity-50"
                                                >
                                                    {getAvailableRolesForMember(member).map((role) => (
                                                        <option key={role} value={role}>
                                                            {formatRole(role)}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* REMOVE BUTTON */}
                                                {canManageMembers && member.role !== 'owner' && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member)}
                                                        disabled={isRemoving}
                                                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                                                    >
                                                        {isRemoving ? 'Removing...' : 'Remove'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="border-t px-8 py-5 flex items-center justify-between bg-slate-50">
                            <div className="text-sm text-slate-500">
                                Total:{' '}
                                <span className="font-medium">
                        {membersMeta?.total ?? members.length}
                    </span>
                            </div>

                            <button
                                onClick={() => {
                                    setIsUsersModalOpen(false);
                                    resetSearchUsersForAdd();
                                    setSelectedUserIdsToAdd([]);
                                    setAddUserSearch('');
                                }}
                                className="px-5 py-3 text-slate-700 hover:bg-slate-200 rounded-2xl font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}