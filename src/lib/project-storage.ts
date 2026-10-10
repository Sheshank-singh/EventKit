import { get, set, del, keys } from 'idb-keyval';
import { EventProject } from '../types';

const PROJECT_PREFIX = 'eventkit_project_';
const inMemoryStore = new Map<string, any>();

/**
 * Saves or updates a project in IndexedDB with local fallback.
 */
export async function saveProject(project: EventProject): Promise<void> {
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof indexedDB !== 'undefined') {
      await set(`${PROJECT_PREFIX}${project.id}`, updatedProject);
      return;
    }
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${PROJECT_PREFIX}${project.id}`, JSON.stringify(updatedProject));
      return;
    }
  } catch (localErr) {
    console.warn('localStorage save failed:', localErr);
  }

  // Fallback to in-memory store (e.g. node / tests)
  inMemoryStore.set(`${PROJECT_PREFIX}${project.id}`, updatedProject);
}

/**
 * Loads a specific project by ID.
 */
export async function loadProject(id: string): Promise<EventProject | null> {
  try {
    if (typeof indexedDB !== 'undefined') {
      const data = await get<EventProject>(`${PROJECT_PREFIX}${id}`);
      if (data) return data;
    }
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
  }

  // Fallback to localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
      if (item) {
        return JSON.parse(item) as EventProject;
      }
    }
  } catch (err) {
    console.warn('localStorage read failed:', err);
  }

  // Fallback to in-memory store
  if (inMemoryStore.has(`${PROJECT_PREFIX}${id}`)) {
    return inMemoryStore.get(`${PROJECT_PREFIX}${id}`);
  }

  return null;
}

/**
 * Lists all locally stored projects sorted by last updated descending.
 */
export async function listProjects(): Promise<EventProject[]> {
  const projectList: EventProject[] = [];

  try {
    if (typeof indexedDB !== 'undefined') {
      const allKeys = await keys();
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith(PROJECT_PREFIX)) {
          const item = await get<EventProject>(key);
          if (item && item.id) {
            projectList.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn('IndexedDB keys retrieval failed:', err);
  }

  // Also check localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PROJECT_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as EventProject;
              if (parsed && parsed.id && !projectList.some(p => p.id === parsed.id)) {
                projectList.push(parsed);
              }
            } catch {
              // Ignore invalid JSON in localStorage
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('localStorage scan failed:', err);
  }

  // Also include in-memory store
  inMemoryStore.forEach((proj, key) => {
    if (key.startsWith(PROJECT_PREFIX) && !projectList.some(p => p.id === proj.id)) {
      projectList.push(proj);
    }
  });

  return projectList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Deletes a project from storage.
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    if (typeof indexedDB !== 'undefined') {
      await del(`${PROJECT_PREFIX}${id}`);
    }
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
    }
  } catch (err) {
    console.warn('localStorage delete failed:', err);
  }

  inMemoryStore.delete(`${PROJECT_PREFIX}${id}`);
}

/**
 * Duplicates an existing project under a new ID.
 */
export async function duplicateProject(id: string): Promise<EventProject> {
  const source = await loadProject(id);
  if (!source) {
    throw new Error('Project not found to duplicate.');
  }

  const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const copy: EventProject = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    metadata: {
      ...source.metadata,
      name: `${source.metadata.name} (Copy)`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProject(copy);
  return copy;
}

/**
 * Validates and parses an imported JSON project file string.
 */
export function validateAndParseProjectJson(jsonStr: string): EventProject {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Invalid JSON format: file could not be parsed.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid project format: expected root object.');
  }

  if (!parsed.metadata || typeof parsed.metadata.name !== 'string') {
    throw new Error('Invalid project structure: missing metadata or event name.');
  }

  if (!Array.isArray(parsed.participants)) {
    parsed.participants = [];
  }

  if (!Array.isArray(parsed.columns)) {
    parsed.columns = [];
  }

  if (!Array.isArray(parsed.documentTypes)) {
    parsed.documentTypes = [];
  }

  const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: newId,
    metadata: {
      name: String(parsed.metadata.name),
      organizer: String(parsed.metadata.organizer || ''),
      eventType: parsed.metadata.eventType || 'workshop',
      startDate: String(parsed.metadata.startDate || ''),
      endDate: String(parsed.metadata.endDate || ''),
      location: String(parsed.metadata.location || ''),
      isOnline: Boolean(parsed.metadata.isOnline),
      description: parsed.metadata.description ? String(parsed.metadata.description) : '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columns: parsed.columns,
    participants: parsed.participants,
    documentTypes: parsed.documentTypes,
    settings: parsed.settings || {
      certificateIdPrefix: 'CERT',
      certificateIdPadding: 4,
      namingConvention: 'event_name_doc_id',
      zipBatchFolderStructure: true,
    },
  };
}
