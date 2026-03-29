import { create } from 'zustand';
import { api } from '../api/axios';

export type ProjectRole = 'owner' | 'admin' | 'member';
export type TaskStatus = 'done' | 'active' | 'archived';

export interface ProjectUserSearchItem {
    _id: string;
    fullName?: string;
    email: string;
    avatar?: string | null;
}

export interface TaskLocation {
    type: 'Point';
    coordinates: [number, number];
}

export interface Project {
    _id: string;
    title: string;
    description?: string | null;
    ownerId: string;
    role: ProjectRole;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectMeta {
    page: number;
    perPage: number;
    lastPage: number;
    total: number;
}

export interface ProjectData {
    data: Project[];
    meta: ProjectMeta;
}

export interface TaskAssignee {
    _id: string;
    fullName?: string;
    email: string;
    avatar?: string | null;
}

export interface Task {
    _id: string;
    projectId?: string;
    columnId?: string;
    title: string;
    description?: string | null;
    labels: string[];
    assigneeIds?: string[];
    assignees?: TaskAssignee[];
    deadline?: string | null;
    order?: number;
    parentTaskId?: string | null;
    status?: TaskStatus | string;
    location?: TaskLocation | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface TaskCommentAuthor {
    _id: string;
    fullName?: string;
    email: string;
    avatar?: string | null;
}

export interface TaskComment {
    _id: string;
    projectId: string;
    taskId: string;
    authorId: string;
    parentCommentId?: string | null;
    content: string;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    author?: TaskCommentAuthor;
    replies: TaskComment[];
}

export interface TaskCommentsState {
    items: TaskComment[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    initialized: boolean;
    meta: PaginationMeta | null;
}

export interface Column {
    _id: string;
    title: string;
    order: number;
    tasks: Task[];
}

export interface ProjectMemberUser {
    _id: string;
    fullName?: string;
    email: string;
    avatar?: string | null;
}

export interface ProjectMember {
    _id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    createdAt?: string;
    updatedAt?: string;
    user: ProjectMemberUser;
}

export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages?: number;
    lastPage?: number;
}

export interface MembersFilters {
    page?: number;
    perPage?: number;
    search?: string;
    role?: ProjectRole;
}

interface LoadAssigneeOptionsParams {
    page?: number;
    perPage?: number;
    search?: string;
    reset?: boolean;
}

export interface ColumnTasksMeta {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
}

export interface ColumnTasksState {
    items: Task[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    initialized: boolean;
    meta: ColumnTasksMeta | null;
}

interface LoadColumnTasksParams {
    limit?: number;
    cursor?: string | null;
    reset?: boolean;
    statuses?: TaskStatus[];
    search?: string;
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string | null;
    labels?: string[];
    assigneeIds?: string[];
    deadline?: string | null;
    parentTaskId?: string | null;
    columnId?: string | null;
    order?: number | null;
    location?: TaskLocation;
    removeLocation?: boolean;
}

interface ProjectState {
    projectListLoading: boolean;
    projectListError: string | null;
    projectList: ProjectData;

    createProjectLoading: boolean;
    createProjectError: string | null;

    projectLoading: boolean;
    projectError: string | null;

    membersLoading: boolean;
    membersError: string | null;

    project: Project | null;
    projectColumns: Column[];

    members: ProjectMember[];
    membersMeta: PaginationMeta | null;
    membersFilters: {
        page: number;
        perPage: number;
        search: string;
        role?: ProjectRole;
    };

    assigneeOptions: ProjectMember[];
    assigneeOptionsLoading: boolean;
    assigneeOptionsLoadingMore: boolean;
    assigneeOptionsError: string | null;
    assigneeOptionsMeta: PaginationMeta | null;
    assigneeSearch: string;

    columnTasks: Record<string, ColumnTasksState>;

    getProjectsList: () => Promise<void>;
    createProject: (title: string, description?: string) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;

    getProject: (projectId: string) => Promise<void>;
    resetProject: () => void;

    addColumn: (projectId: string, title: string) => Promise<void>;
    updateColumn: (
        projectId: string,
        columnId: string,
        data: { title?: string }
    ) => Promise<Column>;
    deleteColumn: (projectId: string, columnId: string) => Promise<void>;

    addTask: (
        projectId: string,
        columnId: string,
        taskData: Partial<Task>,
    ) => Promise<void>;

    updateTask: (
        projectId: string,
        columnId: string,
        taskId: string,
        taskData: UpdateTaskPayload,
    ) => Promise<Task>;

    updateTaskStatus: (
        projectId: string,
        columnId: string,
        taskId: string,
        status: TaskStatus,
    ) => Promise<Task>;

    loadColumnTasks: (
        projectId: string,
        columnId: string,
        params?: LoadColumnTasksParams,
    ) => Promise<void>;
    resetColumnTasks: (columnId?: string) => void;

    getMembers: (projectId: string, filters?: MembersFilters) => Promise<void>;
    removeMember: (projectId: string, memberId: string) => Promise<void>;
    setMembersFilters: (filters: Partial<MembersFilters>) => void;
    resetMembers: () => void;

    loadAssigneeOptions: (
        projectId: string,
        params?: LoadAssigneeOptionsParams,
    ) => Promise<void>;
    resetAssigneeOptions: () => void;
    setAssigneeSearch: (search: string) => void;

    updateProject: (
        projectId: string,
        data: { title?: string; description?: string }
    ) => Promise<Project>;

    memberSearchUsers: ProjectUserSearchItem[];
    memberSearchUsersLoading: boolean;
    memberSearchUsersError: string | null;
    memberSearchUsersMeta: PaginationMeta | null;

    searchUsersForAdd: (
        projectId: string,
        params?: {
            page?: number;
            perPage?: number;
            search?: string;
        },
    ) => Promise<void>;

    resetSearchUsersForAdd: () => void;

    updateMemberRole: (
        projectId: string,
        memberId: string,
        role: ProjectRole,
    ) => Promise<void>;

    addMember: (
        projectId: string,
        data: { userIds: string[]; role: ProjectRole }
    ) => Promise<void>;

    taskComments: Record<string, TaskCommentsState>;

    getTaskComments: (
        projectId: string,
        taskId: string,
        params?: { page?: number; perPage?: number; reset?: boolean }
    ) => Promise<void>;

    createTaskComment: (
        projectId: string,
        taskId: string,
        data: { content: string; parentCommentId?: string | null }
    ) => Promise<TaskComment>;

    resetTaskComments: (taskId?: string) => void;
}

const DEFAULT_ACTIVE_STATUSES: TaskStatus[] = ['active'];

const getErrorMessage = (err: any, fallback: string) => {
    const message = err?.response?.data?.message;

    if (Array.isArray(message)) {
        return message.join(', ');
    }

    if (typeof message === 'string') {
        return message;
    }

    return fallback;
};

const dedupeMembers = (members: ProjectMember[]) => {
    const map = new Map<string, ProjectMember>();

    for (const member of members) {
        map.set(member._id, member);
    }

    return Array.from(map.values());
};

const dedupeTasks = (tasks: Task[]) => {
    const map = new Map<string, Task>();

    for (const task of tasks) {
        map.set(task._id, task);
    }

    return Array.from(map.values()).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
};

const createEmptyColumnTasksState = (): ColumnTasksState => ({
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    initialized: false,
    meta: null,
});

const createEmptyTaskCommentsState = (): TaskCommentsState => ({
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    initialized: false,
    meta: null,
});

const getBacklogColumn = (columns: Column[]) =>
    columns.find((column) => column.title.toLowerCase() === 'backlog');

const mapTaskFromResponse = (data: any): Task => ({
    _id: data._id,
    projectId: data.projectId,
    columnId: data.columnId,
    title: data.title,
    description: data.description ?? null,
    labels: data.labels ?? [],
    assigneeIds: data.assigneeIds ?? [],
    assignees: data.assignees ?? [],
    deadline: data.deadline ?? null,
    order: data.order,
    status: data.status,
    parentTaskId: data.parentTaskId ?? null,
    location: data.location ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
});

const mapCommentFromResponse = (data: any): TaskComment => ({
    _id: data._id,
    projectId: data.projectId,
    taskId: data.taskId,
    authorId: data.authorId,
    parentCommentId: data.parentCommentId ?? null,
    content: data.content,
    deletedAt: data.deletedAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    author: data.author ?? undefined,
    replies: Array.isArray(data.replies)
        ? data.replies.map(mapCommentFromResponse)
        : [],
});

export const useProjectStore = create<ProjectState>((set, get) => ({
    projectListLoading: false,
    projectListError: null,
    projectList: {
        data: [],
        meta: {
            page: 1,
            perPage: 10,
            lastPage: 1,
            total: 0,
        },
    },

    createProjectLoading: false,
    createProjectError: null,

    projectLoading: false,
    projectError: null,

    membersLoading: false,
    membersError: null,

    project: null,
    projectColumns: [],

    members: [],
    membersMeta: null,
    membersFilters: {
        page: 1,
        perPage: 10,
        search: '',
        role: undefined,
    },

    assigneeOptions: [],
    assigneeOptionsLoading: false,
    assigneeOptionsLoadingMore: false,
    assigneeOptionsError: null,
    assigneeOptionsMeta: null,
    assigneeSearch: '',

    columnTasks: {},
    memberSearchUsers: [],
    memberSearchUsersLoading: false,
    memberSearchUsersError: null,
    memberSearchUsersMeta: null,
    taskComments: {},

    resetTaskComments: (taskId) => {
        if (!taskId) {
            set({ taskComments: {} });
            return;
        }

        set((state) => ({
            taskComments: {
                ...state.taskComments,
                [taskId]: createEmptyTaskCommentsState(),
            },
        }));
    },

    getTaskComments: async (projectId, taskId, params) => {
        const page = params?.page ?? 1;
        const perPage = params?.perPage ?? 20;
        const reset = params?.reset ?? false;

        const currentState =
            get().taskComments[taskId] ?? createEmptyTaskCommentsState();

        if (reset) {
            set((state) => ({
                taskComments: {
                    ...state.taskComments,
                    [taskId]: {
                        ...createEmptyTaskCommentsState(),
                        loading: true,
                    },
                },
            }));
        } else {
            if (currentState.loading || currentState.loadingMore) {
                return;
            }

            if (
                currentState.meta &&
                currentState.meta.totalPages &&
                page > currentState.meta.totalPages
            ) {
                return;
            }

            set((state) => ({
                taskComments: {
                    ...state.taskComments,
                    [taskId]: {
                        ...(state.taskComments[taskId] ??
                            createEmptyTaskCommentsState()),
                        loadingMore: true,
                        error: null,
                    },
                },
            }));
        }

        try {
            const res = await api.get(`/project/${projectId}/task/${taskId}/comment`, {
                params: {
                    page,
                    perPage,
                },
            });

            const nextItems: TaskComment[] = (res.data.items ?? []).map(
                mapCommentFromResponse,
            );

            const nextMeta: PaginationMeta | null = res.data.meta ?? null;

            set((state) => {
                const prevState =
                    state.taskComments[taskId] ?? createEmptyTaskCommentsState();

                return {
                    taskComments: {
                        ...state.taskComments,
                        [taskId]: {
                            items: reset
                                ? nextItems
                                : [...prevState.items, ...nextItems],
                            loading: false,
                            loadingMore: false,
                            error: null,
                            initialized: true,
                            meta: nextMeta,
                        },
                    },
                };
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load task comments');

            set((state) => ({
                taskComments: {
                    ...state.taskComments,
                    [taskId]: {
                        ...(state.taskComments[taskId] ??
                            createEmptyTaskCommentsState()),
                        loading: false,
                        loadingMore: false,
                        error: message,
                    },
                },
            }));

            throw new Error(message);
        }
    },

    createTaskComment: async (projectId, taskId, data) => {
        try {
            const res = await api.post(
                `/project/${projectId}/task/${taskId}/comment`,
                {
                    content: data.content,
                    parentCommentId: data.parentCommentId ?? null,
                },
            );

            const createdComment = mapCommentFromResponse(res.data);

            const currentMeta = get().taskComments[taskId]?.meta;

            await get().getTaskComments(projectId, taskId, {
                page: 1,
                perPage: currentMeta?.perPage ?? 20,
                reset: true,
            });

            return createdComment;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to create task comment');

            set((state) => ({
                taskComments: {
                    ...state.taskComments,
                    [taskId]: {
                        ...(state.taskComments[taskId] ??
                            createEmptyTaskCommentsState()),
                        error: message,
                    },
                },
            }));

            throw new Error(message);
        }
    },

    resetSearchUsersForAdd: () => {
        set({
            memberSearchUsers: [],
            memberSearchUsersLoading: false,
            memberSearchUsersError: null,
            memberSearchUsersMeta: null,
        });
    },

    addMember: async (projectId, data) => {
        try {
            await api.post(`/project/${projectId}/members`, data);
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to add members');
            set({ membersError: message });
            throw new Error(message);
        }
    },

    searchUsersForAdd: async (projectId, params) => {
        const page = params?.page ?? 1;
        const perPage = params?.perPage ?? 10;
        const search = params?.search ?? '';

        set({
            memberSearchUsersLoading: true,
            memberSearchUsersError: null,
        });

        try {
            const res = await api.get(`/project/${projectId}/member/search-users`, {
                params: {
                    page,
                    perPage,
                    search: search.trim() || undefined,
                },
            });

            set({
                memberSearchUsers: res.data.data ?? [],
                memberSearchUsersMeta: res.data.meta ?? null,
            });
        } catch (err: any) {
            const message = getErrorMessage(
                err,
                'Failed to search users for add',
            );

            set({
                memberSearchUsersError: message,
            });

            throw new Error(message);
        } finally {
            set({
                memberSearchUsersLoading: false,
            });
        }
    },

    updateMemberRole: async (projectId, memberId, role) => {
        try {
            const res = await api.patch(
                `/project/${projectId}/member/${memberId}/role`,
                { role },
            );

            set((state) => ({
                members: state.members.map((member) =>
                    member.userId === memberId
                        ? {
                            ...member,
                            role,
                        }
                        : member,
                ),
                assigneeOptions: state.assigneeOptions.map((member) =>
                    member.userId === memberId
                        ? {
                            ...member,
                            role,
                        }
                        : member,
                ),
            }));

            return res.data;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to update member role');
            set({ membersError: message });
            throw new Error(message);
        }
    },

    getProjectsList: async () => {
        set({ projectListLoading: true, projectListError: null });

        try {
            const res = await api.get('/project');
            set({ projectList: res.data });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load projects');
            set({ projectListError: message });
            throw new Error(message);
        } finally {
            set({ projectListLoading: false });
        }
    },

    createProject: async (title, description) => {
        set({ createProjectLoading: true, createProjectError: null });

        try {
            await api.post('/project', {
                title,
                description,
            });

            await get().getProjectsList();
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to create project');
            set({ createProjectError: message });
            throw new Error(message);
        } finally {
            set({ createProjectLoading: false });
        }
    },

    deleteProject: async (projectId) => {
        try {
            await api.delete(`/project/${projectId}`);

            set((state) => ({
                projectList: {
                    ...state.projectList,
                    data: state.projectList.data.filter(
                        (project) => project._id !== projectId,
                    ),
                    meta: {
                        ...state.projectList.meta,
                        total: Math.max(0, state.projectList.meta.total - 1),
                        lastPage: Math.max(
                            1,
                            Math.ceil(
                                Math.max(0, state.projectList.meta.total - 1) /
                                state.projectList.meta.perPage,
                            ),
                        ),
                    },
                },
                project:
                    state.project?._id === projectId ? null : state.project,
                projectColumns:
                    state.project?._id === projectId ? [] : state.projectColumns,
                columnTasks:
                    state.project?._id === projectId ? {} : state.columnTasks,
                projectError: null,
                taskComments:
                    state.project?._id === projectId ? {} : state.taskComments,
            }));
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to delete project');
            set({ projectError: message, projectListError: message });
            throw new Error(message);
        }
    },

    resetProject: () => {
        set({
            project: null,
            projectColumns: [],
            projectError: null,
            projectLoading: false,
            columnTasks: {},
            taskComments: {},
        });
    },

    resetMembers: () => {
        set({
            members: [],
            membersMeta: null,
            membersError: null,
            membersLoading: false,
            membersFilters: {
                page: 1,
                perPage: 10,
                search: '',
                role: undefined,
            },
            assigneeOptions: [],
            assigneeOptionsLoading: false,
            assigneeOptionsLoadingMore: false,
            assigneeOptionsError: null,
            assigneeOptionsMeta: null,
            assigneeSearch: '',
        });
    },

    setMembersFilters: (filters) => {
        set((state) => ({
            membersFilters: {
                ...state.membersFilters,
                ...filters,
            },
        }));
    },

    setAssigneeSearch: (search) => {
        set({ assigneeSearch: search });
    },

    resetAssigneeOptions: () => {
        set({
            assigneeOptions: [],
            assigneeOptionsLoading: false,
            assigneeOptionsLoadingMore: false,
            assigneeOptionsError: null,
            assigneeOptionsMeta: null,
            assigneeSearch: '',
        });
    },

    resetColumnTasks: (columnId) => {
        if (!columnId) {
            set({ columnTasks: {} });
            return;
        }

        set((state) => ({
            columnTasks: {
                ...state.columnTasks,
                [columnId]: createEmptyColumnTasksState(),
            },
            projectColumns: state.projectColumns.map((col) =>
                col._id === columnId
                    ? {
                        ...col,
                        tasks: [],
                    }
                    : col,
            ),
        }));
    },

    getProject: async (projectId) => {
        set({ projectLoading: true, projectError: null });

        try {
            const res = await api.get(`/project/${projectId}`);


            console.log(res.data)
            const columns: Column[] = (res.data.columns ?? []).map((col: any) => ({
                _id: col._id,
                title: col.title,
                order: col.order,
                tasks: [],
            }));

            const nextColumnTasks = columns.reduce<Record<string, ColumnTasksState>>(
                (acc, col) => {
                    acc[col._id] = createEmptyColumnTasksState();
                    return acc;
                },
                {},
            );

            set({
                project: res.data.project,
                projectColumns: columns,
                columnTasks: nextColumnTasks,
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load project');
            set({ projectError: message });
            throw new Error(message);
        } finally {
            set({ projectLoading: false });
        }
    },

    updateProject: async (projectId, data) => {
        try {
            const res = await api.patch(`/project/${projectId}`, data);

            set((state) => ({
                project: res.data,
                projectList: {
                    ...state.projectList,
                    data: state.projectList.data.map((project) =>
                        project._id === projectId ? res.data : project,
                    ),
                },
            }));

            return res.data;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to update project');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    addColumn: async (projectId, title) => {
        try {
            const res = await api.post(`/project/${projectId}/column`, { title });

            const newColumn: Column = {
                _id: res.data._id,
                title: res.data.title,
                order: res.data.order,
                tasks: [],
            };

            set((state) => ({
                projectColumns: [...state.projectColumns, newColumn].sort(
                    (a, b) => a.order - b.order,
                ),
                columnTasks: {
                    ...state.columnTasks,
                    [newColumn._id]: createEmptyColumnTasksState(),
                },
            }));
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to add column');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    updateColumn: async (projectId, columnId, data) => {
        try {
            const res = await api.patch(
                `/project/${projectId}/column/${columnId}`,
                data,
            );

            const updatedColumn = res.data;

            set((state) => ({
                projectColumns: state.projectColumns.map((col) =>
                    col._id === columnId
                        ? {
                            ...col,
                            title: updatedColumn.title,
                        }
                        : col,
                ),
            }));

            return updatedColumn;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to update column');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    deleteColumn: async (projectId, columnId) => {
        try {
            await api.delete(`/project/${projectId}/column/${columnId}`);

            set((state) => {
                const deletedColumn = state.projectColumns.find(
                    (column) => column._id === columnId,
                );

                if (!deletedColumn) {
                    return {};
                }

                const backlogColumn = getBacklogColumn(state.projectColumns);

                if (!backlogColumn) {
                    return {
                        projectColumns: state.projectColumns.filter(
                            (column) => column._id !== columnId,
                        ),
                        columnTasks: Object.fromEntries(
                            Object.entries(state.columnTasks).filter(
                                ([key]) => key !== columnId,
                            ),
                        ),
                    };
                }

                const deletedColumnTasks =
                    state.columnTasks[columnId]?.items ?? deletedColumn.tasks ?? [];

                const backlogTasksState =
                    state.columnTasks[backlogColumn._id] ??
                    createEmptyColumnTasksState();

                const movedTasks = deletedColumnTasks.map((task) => ({
                    ...task,
                    columnId: backlogColumn._id,
                }));

                const nextBacklogTasks = dedupeTasks([
                    ...backlogTasksState.items,
                    ...movedTasks,
                ]);

                const nextColumnTasks = Object.fromEntries(
                    Object.entries(state.columnTasks).filter(
                        ([key]) => key !== columnId,
                    ),
                ) as Record<string, ColumnTasksState>;

                nextColumnTasks[backlogColumn._id] = {
                    ...backlogTasksState,
                    items: nextBacklogTasks,
                    initialized: true,
                };

                return {
                    projectColumns: state.projectColumns
                        .filter((column) => column._id !== columnId)
                        .map((column) =>
                            column._id === backlogColumn._id
                                ? {
                                    ...column,
                                    tasks: nextBacklogTasks,
                                }
                                : column,
                        ),
                    columnTasks: nextColumnTasks,
                };
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to delete column');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    addTask: async (projectId, columnId, taskData) => {
        try {
            const payload = {
                title: taskData.title,
                description: taskData.description ?? null,
                labels: taskData.labels ?? [],
                assigneeIds: taskData.assigneeIds ?? [],
                deadline: taskData.deadline ?? null,
                parentTaskId: taskData.parentTaskId ?? null,
                location: taskData.location ?? undefined,
            };

            const res = await api.post(
                `/project/${projectId}/column/${columnId}/task`,
                payload,
            );

            const newTask = mapTaskFromResponse(res.data);

            set((state) => {
                const prevColumnTasks =
                    state.columnTasks[columnId] ?? createEmptyColumnTasksState();

                const nextItems = dedupeTasks([...prevColumnTasks.items, newTask]);

                return {
                    columnTasks: {
                        ...state.columnTasks,
                        [columnId]: {
                            ...prevColumnTasks,
                            items: nextItems,
                            initialized: true,
                        },
                    },
                    projectColumns: state.projectColumns.map((col) =>
                        col._id === columnId
                            ? {
                                ...col,
                                tasks: nextItems,
                            }
                            : col,
                    ),
                };
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to add task');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    updateTask: async (projectId, columnId, taskId, taskData) => {
        try {
            const payload: UpdateTaskPayload = {};

            if (taskData.title !== undefined) {
                payload.title = taskData.title;
            }

            if (taskData.description !== undefined) {
                payload.description = taskData.description;
            }

            if (taskData.labels !== undefined) {
                payload.labels = taskData.labels;
            }

            if (taskData.assigneeIds !== undefined) {
                payload.assigneeIds = taskData.assigneeIds;
            }

            if (taskData.deadline !== undefined) {
                payload.deadline = taskData.deadline;
            }

            if (taskData.parentTaskId !== undefined) {
                payload.parentTaskId = taskData.parentTaskId;
            }

            if (taskData.columnId !== undefined) {
                payload.columnId = taskData.columnId;
            }

            if (taskData.order !== undefined) {
                payload.order = taskData.order;
            }

            if (taskData.location !== undefined) {
                payload.location = taskData.location;
            }

            if (taskData.removeLocation !== undefined) {
                payload.removeLocation = taskData.removeLocation;
            }

            const res = await api.patch(
                `/project/${projectId}/column/${columnId}/task/${taskId}`,
                payload,
            );

            const updatedTask = mapTaskFromResponse(res.data);
            const targetColumnId = updatedTask.columnId ?? columnId;

            set((state) => {
                const nextColumnTasks = { ...state.columnTasks };

                for (const key of Object.keys(nextColumnTasks)) {
                    const current = nextColumnTasks[key] ?? createEmptyColumnTasksState();

                    nextColumnTasks[key] = {
                        ...current,
                        items: current.items.filter((task) => task._id !== taskId),
                    };
                }

                const targetState =
                    nextColumnTasks[targetColumnId] ?? createEmptyColumnTasksState();

                nextColumnTasks[targetColumnId] = {
                    ...targetState,
                    items: dedupeTasks([...targetState.items, updatedTask]),
                    initialized: true,
                };

                const nextProjectColumns = state.projectColumns.map((col) => {
                    const filteredTasks = col.tasks.filter((task) => task._id !== taskId);

                    if (col._id === targetColumnId) {
                        return {
                            ...col,
                            tasks: dedupeTasks([...filteredTasks, updatedTask]),
                        };
                    }

                    return {
                        ...col,
                        tasks: filteredTasks,
                    };
                });

                return {
                    columnTasks: nextColumnTasks,
                    projectColumns: nextProjectColumns,
                };
            });

            return updatedTask;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to update task');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    updateTaskStatus: async (projectId, columnId, taskId, status) => {
        try {
            const res = await api.patch(
                `/project/${projectId}/column/${columnId}/task/${taskId}/status`,
                { status },
            );

            const updatedTask = mapTaskFromResponse(res.data);

            set((state) => {
                const currentColumnState =
                    state.columnTasks[columnId] ?? createEmptyColumnTasksState();

                const nextItems = dedupeTasks(
                    currentColumnState.items.map((task) =>
                        task._id === taskId ? { ...task, ...updatedTask } : task,
                    ),
                );

                return {
                    columnTasks: {
                        ...state.columnTasks,
                        [columnId]: {
                            ...currentColumnState,
                            items: nextItems,
                            initialized: true,
                        },
                    },
                    projectColumns: state.projectColumns.map((col) =>
                        col._id === columnId
                            ? {
                                ...col,
                                tasks: dedupeTasks(
                                    col.tasks.map((task) =>
                                        task._id === taskId
                                            ? { ...task, ...updatedTask }
                                            : task,
                                    ),
                                ),
                            }
                            : col,
                    ),
                };
            });

            return updatedTask;
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to update task status');
            set({ projectError: message });
            throw new Error(message);
        }
    },

    loadColumnTasks: async (projectId, columnId, params) => {
        const limit = params?.limit ?? 20;
        const reset = params?.reset ?? false;
        const statuses = params?.statuses ?? DEFAULT_ACTIVE_STATUSES;
        const search = params?.search?.trim() ?? '';

        const state = get();
        const currentColumnState =
            state.columnTasks[columnId] ?? createEmptyColumnTasksState();

        if (reset && (currentColumnState.loading || currentColumnState.loadingMore)) {
            return;
        }

        const cursor =
            params?.cursor !== undefined
                ? params.cursor
                : reset
                    ? null
                    : currentColumnState.meta?.nextCursor ?? null;

        if (reset) {
            set((currentState) => ({
                columnTasks: {
                    ...currentState.columnTasks,
                    [columnId]: {
                        ...createEmptyColumnTasksState(),
                        loading: true,
                    },
                },
            }));
        } else {
            if (currentColumnState.loading || currentColumnState.loadingMore) {
                return;
            }

            if (
                currentColumnState.initialized &&
                currentColumnState.meta &&
                !currentColumnState.meta.hasMore
            ) {
                return;
            }

            set((currentState) => ({
                columnTasks: {
                    ...currentState.columnTasks,
                    [columnId]: {
                        ...(currentState.columnTasks[columnId] ??
                            createEmptyColumnTasksState()),
                        loadingMore: true,
                        error: null,
                    },
                },
            }));
        }

        try {
            const res = await api.get(`/project/${projectId}/column/${columnId}/task`, {
                params: {
                    limit,
                    cursor: cursor || undefined,
                    statuses: statuses.join(','),
                    search: search || undefined,
                },
            });

            const nextItems: Task[] = (res.data.data ?? []).map(mapTaskFromResponse);
            const nextMeta: ColumnTasksMeta | null = res.data.meta ?? null;

            set((currentState) => {
                const prevState =
                    currentState.columnTasks[columnId] ?? createEmptyColumnTasksState();

                const mergedItems = reset
                    ? dedupeTasks(nextItems)
                    : dedupeTasks([...prevState.items, ...nextItems]);

                return {
                    columnTasks: {
                        ...currentState.columnTasks,
                        [columnId]: {
                            items: mergedItems,
                            loading: false,
                            loadingMore: false,
                            error: null,
                            initialized: true,
                            meta: nextMeta,
                        },
                    },
                    projectColumns: currentState.projectColumns.map((col) =>
                        col._id === columnId
                            ? {
                                ...col,
                                tasks: mergedItems,
                            }
                            : col,
                    ),
                };
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load column tasks');

            set((currentState) => ({
                columnTasks: {
                    ...currentState.columnTasks,
                    [columnId]: {
                        ...(currentState.columnTasks[columnId] ??
                            createEmptyColumnTasksState()),
                        loading: false,
                        loadingMore: false,
                        error: message,
                    },
                },
            }));

            throw new Error(message);
        }
    },

    getMembers: async (projectId, filters) => {
        const currentFilters = {
            ...get().membersFilters,
            ...filters,
        };

        set({
            membersLoading: true,
            membersError: null,
            membersFilters: currentFilters,
        });

        try {
            const params: Record<string, string | number> = {
                page: currentFilters.page,
                perPage: currentFilters.perPage,
            };

            if (currentFilters.search?.trim()) {
                params.search = currentFilters.search.trim();
            }

            if (currentFilters.role) {
                params.role = currentFilters.role;
            }

            const res = await api.get(`/project/${projectId}/member`, { params });

            set({
                members: res.data.data ?? [],
                membersMeta: res.data.meta ?? null,
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load members');
            set({ membersError: message });
            throw new Error(message);
        } finally {
            set({ membersLoading: false });
        }
    },

    removeMember: async (projectId, memberId) => {
        try {
            await api.delete(`/project/${projectId}/member/${memberId}`);

            set((state) => {
                const nextMembers = state.members.filter(
                    (item) => item.userId !== memberId,
                );

                const nextAssigneeOptions = state.assigneeOptions.filter(
                    (item) => item.userId !== memberId,
                );

                return {
                    members: nextMembers,
                    assigneeOptions: nextAssigneeOptions,
                    membersMeta: state.membersMeta
                        ? {
                            ...state.membersMeta,
                            total: Math.max(0, state.membersMeta.total - 1),
                            totalPages: state.membersMeta.perPage
                                ? Math.ceil(
                                    Math.max(0, state.membersMeta.total - 1) /
                                    state.membersMeta.perPage,
                                )
                                : state.membersMeta.totalPages,
                        }
                        : null,
                    assigneeOptionsMeta: state.assigneeOptionsMeta
                        ? {
                            ...state.assigneeOptionsMeta,
                            total: Math.max(0, state.assigneeOptionsMeta.total - 1),
                            totalPages: state.assigneeOptionsMeta.perPage
                                ? Math.ceil(
                                    Math.max(
                                        0,
                                        state.assigneeOptionsMeta.total - 1,
                                    ) / state.assigneeOptionsMeta.perPage,
                                )
                                : state.assigneeOptionsMeta.totalPages,
                        }
                        : null,
                };
            });
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to remove member');
            set({ membersError: message });
            throw new Error(message);
        }
    },

    loadAssigneeOptions: async (projectId, params) => {
        const page = params?.page ?? 1;
        const perPage = params?.perPage ?? 20;
        const search = params?.search ?? '';
        const reset = params?.reset ?? false;

        const state = get();

        if (reset) {
            set({
                assigneeOptionsLoading: true,
                assigneeOptionsLoadingMore: false,
                assigneeOptionsError: null,
            });
        } else {
            if (state.assigneeOptionsLoading || state.assigneeOptionsLoadingMore) {
                return;
            }

            const currentPage = state.assigneeOptionsMeta?.page ?? 1;
            const totalPages = state.assigneeOptionsMeta?.totalPages ?? 1;

            if (currentPage >= totalPages && state.assigneeOptions.length > 0) {
                return;
            }

            set({
                assigneeOptionsLoadingMore: true,
                assigneeOptionsError: null,
            });
        }

        try {
            const response = await api.get(`/project/${projectId}/member`, {
                params: {
                    page,
                    perPage,
                    search: search.trim() || undefined,
                },
            });

            const nextData: ProjectMember[] = response.data.data ?? [];
            const nextMeta: PaginationMeta | null = response.data.meta ?? null;

            set((currentState) => ({
                assigneeOptions: reset
                    ? nextData
                    : dedupeMembers([...currentState.assigneeOptions, ...nextData]),
                assigneeOptionsMeta: nextMeta,
                assigneeSearch: search,
            }));
        } catch (err: any) {
            const message = getErrorMessage(err, 'Failed to load assignee options');

            set({
                assigneeOptionsError: message,
            });

            throw new Error(message);
        } finally {
            set({
                assigneeOptionsLoading: false,
                assigneeOptionsLoadingMore: false,
            });
        }
    },
}));