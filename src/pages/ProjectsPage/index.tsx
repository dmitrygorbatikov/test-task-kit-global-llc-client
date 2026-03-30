import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../shared/stores/projectStore';

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
};

const roleBadgeClasses: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-gray-100 text-gray-700',
};

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'string') return error;

    if (error && typeof error === 'object') {
        const err = error as {
            message?: string;
            response?: {
                data?: {
                    message?: string | string[];
                    error?: string;
                };
            };
        };

        if (Array.isArray(err.response?.data?.message)) {
            return err.response?.data?.message.join(', ');
        }

        if (typeof err.response?.data?.message === 'string') {
            return err.response.data.message;
        }

        if (typeof err.message === 'string') {
            return err.message;
        }

        if (typeof err.response?.data?.error === 'string') {
            return err.response.data.error;
        }
    }

    return fallback;
}

export default function ProjectsPage() {
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    const [createError, setCreateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [pageInitError, setPageInitError] = useState<string | null>(null);

    const {
        projectList,
        projectListLoading,
        projectListError,
        getProjectsList,
        createProject,
        createProjectLoading,
        deleteProject,
    } = useProjectStore();

    const loadProjects = async () => {
        setPageInitError(null);

        try {
            await getProjectsList();
        } catch (error) {
            const message = getErrorMessage(
                error,
                'Failed to load projects. Please try again.',
            );

            setPageInitError(message);
            console.error('Failed to load projects:', error);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const resetCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewProjectName('');
        setNewProjectDescription('');
        setCreateError(null);
    };

    const handleOpenCreateModal = () => {
        setCreateError(null);
        setIsCreateModalOpen(true);
    };

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const title = newProjectName.trim();
        const description = newProjectDescription.trim();

        if (!title) {
            setCreateError('Project title is required.');
            return;
        }

        setCreateError(null);

        try {
            await createProject(title, description || undefined);
            resetCreateModal();
        } catch (error) {
            const message = getErrorMessage(
                error,
                'Failed to create project. Please try again.',
            );

            setCreateError(message);
            console.error('Failed to create project:', error);
        }
    };

    const handleDeleteProject = async (
        e: React.MouseEvent<HTMLButtonElement>,
        projectId: string,
        projectTitle: string,
    ) => {
        e.stopPropagation();

        setDeleteError(null);

        const confirmed = window.confirm(
            `Are you sure you want to delete project "${projectTitle}"?`,
        );

        if (!confirmed) return;

        try {
            setDeletingProjectId(projectId);
            await deleteProject(projectId);
        } catch (error) {
            const message = getErrorMessage(
                error,
                `Failed to delete project "${projectTitle}". Please try again.`,
            );

            setDeleteError(message);
            console.error('Failed to delete project:', error);
        } finally {
            setDeletingProjectId(null);
        }
    };

    const combinedListError = pageInitError || projectListError || null;

    if (projectListLoading && projectList.data.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-gray-600 text-lg">Loading projects...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>

                    {combinedListError && (
                        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700">{combinedListError}</p>

                            <button
                                type="button"
                                onClick={loadProjects}
                                className="mt-3 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {deleteError && (
                        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700">{deleteError}</p>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Create Project
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projectList.data.length > 0 ? (
                    projectList.data.map((project) => {
                        const role = project.role ?? 'member';
                        const isDeleting = deletingProjectId === project._id;

                        return (
                            <div
                                key={project._id}
                                onClick={() => {
                                    if (isDeleting) return;
                                    navigate(`/projects/${project._id}`);
                                }}
                                className="text-left bg-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h2 className="text-xl font-semibold text-gray-900 break-words">
                                        {project.title}
                                    </h2>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                roleBadgeClasses[role] ?? roleBadgeClasses.member
                                            }`}
                                        >
                                            {roleLabels[role] ?? role}
                                        </span>

                                        {role === 'owner' && (
                                            <button
                                                type="button"
                                                onClick={(e) =>
                                                    handleDeleteProject(
                                                        e,
                                                        project._id,
                                                        project.title,
                                                    )
                                                }
                                                disabled={isDeleting}
                                                className="inline-flex items-center justify-center rounded-xl p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete project"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {project.description ? (
                                    <p className="text-gray-700 mb-4 line-clamp-2">
                                        {project.description}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 mb-4 italic">
                                        No description
                                    </p>
                                )}

                                <div className="flex flex-col gap-1 text-sm text-gray-500">
                                    {project.createdAt && (
                                        <p>
                                            Created:{' '}
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </p>
                                    )}

                                    {project.updatedAt && (
                                        <p>
                                            Updated:{' '}
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {isDeleting && (
                                    <p className="mt-3 text-sm text-red-500">
                                        Deleting project...
                                    </p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow">
                        <p className="text-gray-500 text-lg">No projects yet</p>
                        <p className="text-gray-400 mt-2">
                            Create your first project to get started
                        </p>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b">
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Create New Project
                            </h2>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                            {createError && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-sm text-red-700">{createError}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => {
                                        setNewProjectName(e.target.value);
                                        if (createError) setCreateError(null);
                                    }}
                                    required
                                    className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newProjectDescription}
                                    onChange={(e) => {
                                        setNewProjectDescription(e.target.value);
                                        if (createError) setCreateError(null);
                                    }}
                                    rows={4}
                                    className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500 resize-y"
                                    placeholder="Brief description of the project..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetCreateModal}
                                    className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-100 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={createProjectLoading || !newProjectName.trim()}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-2xl transition-colors disabled:cursor-not-allowed"
                                >
                                    {createProjectLoading ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}