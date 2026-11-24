// src/lib/jobStore.ts
export interface ProcessedJob {
  jobId: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  fileSize: number;
  originalSize?: number;
  toolSlug?: string;
  pageCount?: number;
  isTextDominated?: boolean;
  createdAt: number;
}

// Global in-memory storage for client-side processed files
const jobs = new Map<string, ProcessedJob>();

export const jobStore = {
  setJob(jobId: string, data: Omit<ProcessedJob, 'jobId' | 'createdAt'>): void {
    const job: ProcessedJob = {
      ...data,
      jobId,
      createdAt: Date.now(),
    };
    jobs.set(jobId, job);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          `purepdf_meta_${jobId}`,
          JSON.stringify({
            jobId,
            filename: job.filename,
            mimeType: job.mimeType,
            fileSize: job.fileSize,
            originalSize: job.originalSize,
            toolSlug: job.toolSlug,
            pageCount: job.pageCount,
            createdAt: job.createdAt,
          })
        );
      } catch (e) {
        console.warn('sessionStorage quota exceeded or unavailable', e);
      }
    }
  },

  getJob(jobId: string): ProcessedJob | undefined {
    return jobs.get(jobId);
  },

  getMeta(jobId: string): Partial<ProcessedJob> | null {
    if (typeof window === 'undefined') return null;
    const item = sessionStorage.getItem(`purepdf_meta_${jobId}`);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  },

  clearJob(jobId: string): void {
    jobs.delete(jobId);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`purepdf_meta_${jobId}`);
    }
  },
};
