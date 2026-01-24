export const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

export const statusToVariant = (
  status: string
): 'pending' | 'submitted' | 'approved' | 'rejected' => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'SUBMITTED':
      return 'submitted';
    default:
      return 'pending';
  }
};
