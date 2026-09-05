export function formatDate(date: Date) {
  return date
    .toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
    .replace(/\//g, '.');
}
