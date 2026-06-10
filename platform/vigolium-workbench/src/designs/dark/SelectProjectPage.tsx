'use client';

import { useState, useMemo } from 'react';
import { FolderKanban, Plus, Search, Check, Copy, Pencil, Trash2, ArrowRight } from 'lucide-react';
import PageShell from './PageShell';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useProjectStats,
} from '@/api/hooks';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import type { Project } from '@/api/types';

export default function SelectProjectPage() {
  const { toast } = useToast();
  const { projectUUID, setProject } = useProjectContext();
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q),
    );
  }, [projects, search]);

  // Mirror Header.switchProject: set the active project, then hard-navigate so
  // every project-scoped React Query cache is rebuilt under the new UUID.
  const openProject = (uuid: string) => {
    setProject(uuid);
    window.location.href = '/';
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate(
      { name: newName.trim(), description: newDesc.trim() || undefined },
      {
        onSuccess: (p) => {
          toast(`project "${p.name}" created`, 'success');
          setNewName('');
          setNewDesc('');
          setShowCreate(false);
        },
        onError: () => toast('error creating project', 'error'),
      },
    );
  };

  const handleDelete = (uuid: string) => {
    deleteProject.mutate(uuid, {
      onSuccess: () => {
        toast('project deleted', 'success');
        setConfirmDelete(null);
        if (projectUUID === uuid) setProject(null);
      },
      onError: () => toast('error deleting project', 'error'),
    });
  };

  return (
    <PageShell>
      <div className="px-4 py-4">
        <div
          className="flex items-center justify-between gap-3 flex-wrap pb-2 mb-4 border-b"
          style={{ borderColor: 'var(--v-border)' }}
        >
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" style={{ color: 'var(--v-secondary)' }} />
            <h1 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--v-accent)' }}>
              Select a project
            </h1>
            <span className="text-xs" style={{ color: 'var(--v-text-muted)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 border px-2 py-0.5"
              style={{ borderColor: 'var(--v-border)', backgroundColor: 'var(--v-surface)' }}
            >
              <Search className="w-3 h-3" style={{ color: 'var(--v-text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search projects..."
                className="bg-transparent text-xs outline-none w-40"
                style={{ color: 'var(--v-text)' }}
              />
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 border transition-colors"
              style={{ borderColor: 'var(--v-accent)', color: 'var(--v-accent)' }}
            >
              <Plus className="w-3 h-3" /> new
            </button>
          </div>
        </div>

        {showCreate && (
          <div
            className="border p-3 space-y-2 mb-4"
            style={{ borderColor: 'var(--v-accent)', backgroundColor: 'var(--v-surface)' }}
          >
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="project name"
              className="w-full border text-xs px-2 py-1 focus:outline-none"
              style={{ backgroundColor: 'var(--v-bg)', borderColor: 'var(--v-border)', color: 'var(--v-text)' }}
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="description (optional)"
              className="w-full border text-xs px-2 py-1 focus:outline-none"
              style={{ backgroundColor: 'var(--v-bg)', borderColor: 'var(--v-border)', color: 'var(--v-text)' }}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createProject.isPending}
                className="text-[10px] font-bold uppercase px-2 py-0.5 border transition-colors disabled:opacity-40"
                style={{ borderColor: 'var(--v-success)', color: 'var(--v-success)' }}
              >
                {createProject.isPending ? 'creating...' : 'create'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setNewDesc('');
                }}
                className="text-[10px] font-bold uppercase px-2 py-0.5 border transition-colors"
                style={{ borderColor: 'var(--v-border)', color: 'var(--v-text-muted)' }}
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-xs" style={{ color: 'var(--v-text-muted)' }}>
            loading projects…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="border px-4 py-8 text-center text-xs"
            style={{ borderColor: 'var(--v-border)', color: 'var(--v-text-muted)' }}
          >
            {search ? `no projects match "${search}"` : 'no projects yet — create one to get started'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <ProjectCard
                key={p.uuid}
                project={p}
                isCurrent={projectUUID === p.uuid}
                isConfirmingDelete={confirmDelete === p.uuid}
                onOpen={() => openProject(p.uuid)}
                onAskDelete={() => setConfirmDelete(p.uuid)}
                onCancelDelete={() => setConfirmDelete(null)}
                onConfirmDelete={() => handleDelete(p.uuid)}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

interface ProjectCardProps {
  project: Project;
  isCurrent: boolean;
  isConfirmingDelete: boolean;
  onOpen: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function ProjectCard({
  project,
  isCurrent,
  isConfirmingDelete,
  onOpen,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProjectCardProps) {
  const { data: s } = useProjectStats(project.uuid);
  const { toast } = useToast();
  const updateProject = useUpdateProject();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description ?? '');

  const startEdit = () => {
    setName(project.name);
    setDesc(project.description ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!name.trim()) return;
    updateProject.mutate(
      { uuid: project.uuid, name: name.trim(), description: desc.trim() },
      {
        onSuccess: () => {
          toast('project updated', 'success');
          setEditing(false);
        },
        onError: () => toast('error updating project', 'error'),
      },
    );
  };

  const copyUUID = async () => {
    try {
      await navigator.clipboard.writeText(project.uuid);
      toast('project uuid copied', 'success');
    } catch {
      toast('failed to copy uuid', 'error');
    }
  };

  return (
    <div
      className="border flex flex-col p-3 gap-2 transition-colors"
      style={{
        borderColor: isCurrent ? 'var(--v-accent)' : 'var(--v-border)',
        backgroundColor: isCurrent
          ? 'color-mix(in srgb, var(--v-accent) 8%, transparent)'
          : 'var(--v-surface)',
      }}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            placeholder="project name"
            className="w-full border text-xs px-2 py-1 focus:outline-none"
            style={{ backgroundColor: 'var(--v-bg)', borderColor: 'var(--v-border)', color: 'var(--v-text)' }}
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="description"
            rows={2}
            className="w-full border text-xs px-2 py-1 focus:outline-none resize-none"
            style={{ backgroundColor: 'var(--v-bg)', borderColor: 'var(--v-border)', color: 'var(--v-text)' }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveEdit}
              disabled={!name.trim() || updateProject.isPending}
              className="text-[10px] font-bold uppercase px-2 py-0.5 border transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--v-success)', color: 'var(--v-success)' }}
            >
              {updateProject.isPending ? 'saving...' : 'save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[10px] font-bold uppercase px-2 py-0.5 border transition-colors"
              style={{ borderColor: 'var(--v-border)', color: 'var(--v-text-muted)' }}
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {isCurrent && <Check className="w-3 h-3 shrink-0" style={{ color: 'var(--v-accent)' }} />}
                <span
                  className="font-bold text-sm break-words leading-tight"
                  style={{ color: isCurrent ? 'var(--v-accent)' : 'var(--v-text)' }}
                >
                  {project.name}
                </span>
              </div>
              <button
                onClick={copyUUID}
                title={`Copy project UUID: ${project.uuid}`}
                className="flex items-center gap-1 mt-0.5 font-mono text-[10px] max-w-full truncate hover:underline"
                style={{ color: 'var(--v-text-muted)' }}
              >
                <Copy className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{project.uuid}</span>
              </button>
            </div>
            {isCurrent && (
              <span
                className="text-[9px] px-1 border shrink-0"
                style={{
                  borderColor: 'color-mix(in srgb, var(--v-accent) 40%, transparent)',
                  color: 'var(--v-accent)',
                }}
              >
                active
              </span>
            )}
          </div>

          <p className="text-xs leading-snug min-h-[1.5rem]" style={{ color: 'var(--v-text-muted)' }}>
            {project.description || '—'}
          </p>

          <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: 'var(--v-text-muted)' }}>
            <span className="tabular-nums" style={{ color: 'var(--v-text)' }}>
              {s?.http_records?.total ?? 0} <span style={{ color: 'var(--v-text-muted)' }}>rec</span>
            </span>
            <span>·</span>
            <span className="tabular-nums" style={{ color: 'var(--v-text)' }}>
              {s?.scans ?? 0} <span style={{ color: 'var(--v-text-muted)' }}>scans</span>
            </span>
            <span>·</span>
            <span className="tabular-nums" style={{ color: 'var(--v-text)' }}>
              {s?.agent_runs ?? 0} <span style={{ color: 'var(--v-text-muted)' }}>agents</span>
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {(s?.findings?.critical ?? 0) > 0 && (
                <span
                  className="px-1 border"
                  style={{ color: 'var(--v-error)', borderColor: 'color-mix(in srgb, var(--v-error) 30%, transparent)' }}
                >
                  C:{s!.findings.critical}
                </span>
              )}
              {(s?.findings?.high ?? 0) > 0 && (
                <span
                  className="px-1 border"
                  style={{ color: '#f97316', borderColor: 'color-mix(in srgb, #f97316 30%, transparent)' }}
                >
                  H:{s!.findings.high}
                </span>
              )}
              {(s?.findings?.medium ?? 0) > 0 && (
                <span
                  className="px-1 border"
                  style={{ color: '#eab308', borderColor: 'color-mix(in srgb, #eab308 30%, transparent)' }}
                >
                  M:{s!.findings.medium}
                </span>
              )}
              {(s?.findings?.low ?? 0) > 0 && (
                <span
                  className="px-1 border"
                  style={{ color: 'var(--v-secondary)', borderColor: 'color-mix(in srgb, var(--v-secondary) 30%, transparent)' }}
                >
                  L:{s!.findings.low}
                </span>
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-between gap-2 pt-2 mt-auto border-t"
            style={{ borderColor: 'var(--v-border)' }}
          >
            <button
              onClick={onOpen}
              className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 border transition-colors"
              style={{ borderColor: 'var(--v-accent)', color: 'var(--v-accent)' }}
            >
              {isCurrent ? 'open' : 'use & open'} <ArrowRight className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={startEdit}
                className="flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-1"
                style={{ color: 'var(--v-text-muted)' }}
              >
                <Pencil className="w-3 h-3" /> edit
              </button>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onConfirmDelete}
                    className="text-[10px] font-bold uppercase px-1.5 py-1 border"
                    style={{ borderColor: 'var(--v-error)', color: 'var(--v-error)' }}
                  >
                    confirm
                  </button>
                  <button
                    onClick={onCancelDelete}
                    className="text-[10px] font-bold uppercase px-1.5 py-1"
                    style={{ color: 'var(--v-text-muted)' }}
                  >
                    no
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAskDelete}
                  title="Delete project"
                  className="flex items-center text-[10px] font-bold uppercase px-1.5 py-1"
                  style={{ color: 'var(--v-text-muted)' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
