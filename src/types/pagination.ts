export type PaginationResponseDto<T> = {
  data: T[];
  metaData: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};
