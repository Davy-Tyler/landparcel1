export const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'locked':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_payment':
      return 'bg-orange-100 text-orange-800';
    case 'sold':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'locked':
      return 'In Cart';
    case 'pending_payment':
      return 'Pending Payment';
    case 'sold':
      return 'Sold';
    default:
      return status;
  }
};

export const isPlotAvailableForPurchase = (plot: any) => {
  return plot.status === 'available';
};

export const isPlotLocked = (plot: any) => {
  if (plot.status !== 'locked') return false;
  
  // Check if lock has expired (15 minutes)
  if (plot.locked_until) {
    const lockExpiry = new Date(plot.locked_until);
    const now = new Date();
    return now < lockExpiry;
  }
  
  return true;
};