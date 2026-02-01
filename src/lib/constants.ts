export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
export const ACCEPTED_FILE_TYPES = ['application/pdf'];

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest Uploads' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'highest_rated', label: 'Highest Rated' },
] as const;

export const BADGE_INFO = {
  newcomer: { label: 'Newcomer', minPoints: 0, color: 'bg-muted text-muted-foreground' },
  contributor: { label: 'Contributor', minPoints: 50, color: 'bg-primary/20 text-primary' },
  expert: { label: 'Expert', minPoints: 200, color: 'bg-accent text-accent-foreground' },
  legend: { label: 'Legend', minPoints: 500, color: 'bg-chart-1 text-foreground' },
} as const;

export const POINTS_PER_UPLOAD = 10;
export const POINTS_PER_DOWNLOAD = 1;
export const POINTS_PER_RATING = 2;
