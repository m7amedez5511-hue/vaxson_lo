export const maintenanceSelect = {
  id: true,
  carId: true,
  reason: true,
  cost: true,
  startAt: true,
  endAt: true,
  createdAt: true,
  car: {
    select: {
      id: true,
      plateNumber: true,
      plateLetters: true,
      manufacturer: true,
      model: true,
    },
  },
  images: {
    where: { isDeleted: false },
    select: {
      id: true,
      image: true,
      publicId: true,
      stage: true,
    },
  },
};

export const maintenanceArchiveSelect = {
  ...maintenanceSelect,
  images: {
    select: {
      id: true,
      image: true,
      publicId: true,
      stage: true,
      isDeleted: true,
      deletedAt: true,
    },
  },
};
