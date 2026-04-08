export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CO', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    timeZone: 'UTC'
  });
};

export const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
};

export const getMatchedNumbers = (play: number[], winner: number[]) => {
  return play.filter(n => winner.includes(n));
};
