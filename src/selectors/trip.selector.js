// trip.selector.js
export const tripSelect = {
  id: true,
  tripNumber: true,
  title: true,
  startTime: true,
  endTime: true,
  collectedCount: true,
  deliveredCount: true,
  returnedCount: true,
  totalCashCollected: true,
  endReason: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
    
  car: {
    select: {
      id: true,
      manufacturer: true,
      model: true,
      plateNumber: true,
      plateLetters: true,
    },
  },
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
      userName: true,
    },
  },
  branch: {
    select: { id: true, name: true },
  },
  orders: true,
};

   
export const tripInclude = null;