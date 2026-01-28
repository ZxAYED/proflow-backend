export const buildDynamicFilters = (
  payload: Record<string, unknown>,
  searchFields: string[],
  filterableFields: string[],
) => {
  const { searchTerm, ...filterData } = payload;
  const andConditions = [];

  // Search
  if (searchTerm) {
    andConditions.push({
      OR: searchFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        if (filterableFields.includes(key)) {
          return {
            [key]: {
              equals: (filterData as any)[key],
            },
          };
        }
      }),
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
};
