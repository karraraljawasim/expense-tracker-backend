export type PaginationResponseDto<T> = {
  data?: T[];
  metaData: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type paginationQuery = { page: string; pageSize: string };
