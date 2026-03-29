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

export default function ProjectsPage() {
    const navigate = useNavigate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    const {
        projectList,
        projectListLoading,
        projectListError,
        getProjectsList,
        createProject,
        createProjectLoading,
        deleteProject,
    } = useProjectStore();

    useEffect(() => {
        getProjectsList().catch((err) => {
            console.error('Failed to load projects:', err);
        });
    }, [getProjectsList]);

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!newProjectName.trim()) return;

        try {
            await createProject(
                newProjectName.trim(),
                newProjectDescription.trim() || undefined,
            );

            setNewProjectName('');
            setNewProjectDescription('');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleDeleteProject = async (
        e: React.MouseEvent<HTMLButtonElement>,
        projectId: string,
        projectTitle: string,
    ) => {
        e.stopPropagation();

        const confirmed = window.confirm(
            `Are you sure you want to delete project "${projectTitle}"?`,
        );

        if (!confirmed) return;

        try {
            setDeletingProjectId(projectId);
            await deleteProject(projectId);
        } catch (error) {
            console.error('Failed to delete project:', error);
        } finally {
            setDeletingProjectId(null);
        }
    };

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

                    {projectListError && (
                        <p className="text-red-600 mt-2 text-sm">{projectListError}</p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
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
                                onClick={() => navigate(`/projects/${project._id}`)}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
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
                                    onChange={(e) =>
                                        setNewProjectDescription(e.target.value)
                                    }
                                    rows={4}
                                    className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500 resize-y"
                                    placeholder="Brief description of the project..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setNewProjectName('');
                                        setNewProjectDescription('');
                                    }}
                                    className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-100 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={createProjectLoading || !newProjectName.trim()}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-2xl transition-colors"
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