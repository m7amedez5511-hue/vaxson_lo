export const tripReportSelect = {
  id: true,
  tripNumber: true,
  title: true,
  status: true,
  startTime: true,
  endTime: true,
  notes: true,
  collectedCount: true,
  deliveredCount: true,
  returnedCount: true,
  reportFile: true,
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
    }
  },
  car: {
    select: {
      id: true,
      manufacturer: true,
      model: true,
      plateNumber: true,
      plateLetters: true,
    }
  },
  branch: {
    select: {
      id: true,
      name: true,
    }
  },
  orders: {
    select: {
      id: true,
      clientId: true,
      client: { select: { name: true } },
      shipmentNumber: true,
      recipientName: true,
      recipientPhone: true,
      currentStatus: true,
      totalPrice: true,
      statusHistory: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
        select: {
          status: true,
          reason: true,
        }
      }
    }
  }
};
